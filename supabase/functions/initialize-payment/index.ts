import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InitializePaymentPayload {
    planId: string;
    callbackUrl: string;
    cancelUrl: string;
}

interface PaystackInitializeResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { planId, callbackUrl, cancelUrl }: InitializePaymentPayload = await req.json();

        if (!planId || !callbackUrl || !cancelUrl) {
            return new Response(JSON.stringify({ error: 'Missing required fields: planId, callbackUrl, cancelUrl' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not authenticated' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const { data: plan, error: planError } = await supabaseClient
            .from('subscription_plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (planError || !plan) {
            throw new Error(`Plan with ID ${planId} not found.`);
        }

        const reference = `august_${user.id.substring(0, 8)}_${Date.now()}`;
        const subscriptionRecord = {
            user_id: user.id,
            plan_id: plan.id,
            transaction_reference: reference,
            status: 'pending' as const,
            amount: plan.amount,
            currency: plan.currency,
        }

        const { error: insertError } = await supabaseClient
            .from('subscriptions')
            .insert(subscriptionRecord);

        if (insertError) {
            throw new Error(`Failed to create pending subscription: ${insertError.message}`);
        }

        const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
        const paystackPayload = {
            email: user.email,
            amount: plan.amount,
            plan: plan.plan_code,
            reference: reference,
            callback_url: callbackUrl,
            metadata: {
                cancel_action: cancelUrl,
                user_id: user.id,
                plan_id: plan.id,
            },
        }

        const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${paystackSecretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paystackPayload),
        });

        const paystackData: PaystackInitializeResponse = await paystackResponse.json();

        if (!paystackResponse.ok || !paystackData.status) {
            throw new Error(`Paystack API error: ${paystackData.message}`);
        }

        return new Response(JSON.stringify({ authorizationUrl: paystackData.data.authorization_url }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Initialize payment error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});