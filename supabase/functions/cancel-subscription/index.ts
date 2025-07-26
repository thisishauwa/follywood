import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CancelPayload {
    subscriptionId: string;
}

interface PaystackSubscriptionData {
    id: number;
    status: 'active' | 'non-renewing' | string;
    subscription_code: string;
    email_token: string;
    next_payment_date: string;
}

interface PaystackSubscriptionResponse {
    status: boolean;
    message: string;
    data?: PaystackSubscriptionData;
}

interface PaystackDisableResponse {
    status: boolean;
    message: string;
    data?: {
        status: string;
    };
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { subscriptionId }: CancelPayload = await req.json();
        if (!subscriptionId) {
            throw new Error('Subscription ID is required.');
        }

        const supabaseAdmin: SupabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: subscription, error: fetchError } = await supabaseAdmin
            .from('subscriptions')
            .select('paystack_subscription_code, next_payment_date')
            .eq('id', subscriptionId)
            .single();

        if (fetchError || !subscription || !subscription.paystack_subscription_code) {
            throw new Error(`Subscription not found or missing Paystack code for ID: ${subscriptionId}`);
        }

        const paystackCode = subscription.paystack_subscription_code;
        const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
        if (!paystackSecret) {
            throw new Error('Paystack secret key is not configured.');
        }

        const getSubResponse = await fetch(`https://api.paystack.co/subscription/${paystackCode}`, {
            headers: {
                Authorization: `Bearer ${paystackSecret}`,
            },
        });

        if (!getSubResponse.ok) {
            const errorBody = await getSubResponse.text();
            throw new Error(`Failed to fetch subscription details from Paystack. Status: ${getSubResponse.status}. Body: ${errorBody}`);
        }

        const paystackSubData: PaystackSubscriptionResponse = await getSubResponse.json();

        if (!paystackSubData.status || !paystackSubData.data) {
            throw new Error('Invalid response from Paystack subscription endpoint');
        }

        const { status, email_token, next_payment_date } = paystackSubData.data;

        if (status !== 'active') {
            const { error: updateError } = await supabaseAdmin
                .from('subscriptions')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    end_date: next_payment_date,
                    updated_at: new Date().toISOString(),
                })
                .eq('paystack_subscription_code', paystackCode);

            if (updateError) {
                throw new Error(`Failed to sync local subscription state: ${updateError.message}`);
            }

            return new Response(JSON.stringify({
                message: 'Subscription is already inactive. Local state has been synchronized.'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        const disableResponse = await fetch('https://api.paystack.co/subscription/disable', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${paystackSecret}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: paystackCode,
                token: email_token,
            }),
        });

        const disableData: PaystackDisableResponse = await disableResponse.json();

        if (!disableData.status) {
            if (disableData.message?.includes('already inactive')) {
                const { error: updateError } = await supabaseAdmin
                    .from('subscriptions')
                    .update({
                        status: 'cancelled',
                        cancelled_at: new Date().toISOString(),
                        end_date: subscription.next_payment_date,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('paystack_subscription_code', paystackCode);

                if (updateError) {
                    throw new Error(`Failed to sync local subscription state: ${updateError.message}`);
                }

                return new Response(JSON.stringify({
                    message: 'Subscription was already cancelled. Local state has been synchronized.'
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
            }

            throw new Error(`Paystack cancellation failed: ${disableData.message}`);
        }

        const currentTimestamp = new Date().toISOString();
        const { error: updateError } = await supabaseAdmin
            .from('subscriptions')
            .update({
                status: 'cancelled',
                cancelled_at: currentTimestamp,
                end_date: next_payment_date,
                updated_at: currentTimestamp,
            })
            .eq('id', subscriptionId);

        if (updateError) {
            throw new Error(`Failed to update subscription after cancellation: ${updateError.message}`);
        }

        return new Response(JSON.stringify({
            message: 'Subscription cancelled successfully.'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});