import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaystackPlan {
  id: number;
  name: string;
  plan_code: string;
  description: string | null;
  amount: number;
  interval: 'annually' | 'monthly' | string;
  send_invoices: boolean;
  send_sms: boolean;
  currency: string;
}

interface PaystackCustomer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  customer_code: string;
  phone: string | null;
  metadata: Record<string, unknown> | null;
}

interface ChargeSuccessData {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  paid_at: string;
  created_at: string;
  currency: string;
  customer: PaystackCustomer;
  plan: PaystackPlan;
}

interface PaystackSubscription {
  id: number;
  subscription_code: string;
  email_token: string;
  amount: number;
  status: 'active' | string;
  next_payment_date: string;
  plan: PaystackPlan;
  customer: PaystackCustomer;
  createdAt: string;
}

interface WebhookPayload<T> {
  event: string;
  data: T;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payloadBody = await req.text();
    const payload = JSON.parse(payloadBody);

    const signature = req.headers.get('x-paystack-signature')
    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY')

    if (signature && paystackSecret) {
      const expectedSignature = await generateSignature(payloadBody, paystackSecret)
      if (signature !== expectedSignature) {
        return new Response('Invalid signature', {
          status: 401,
          headers: corsHeaders
        })
      }
    }

    switch (payload.event) {
      case 'charge.success':
        await handleChargeSuccess(supabaseClient, payload.data)
        break
      case 'subscription.disabled':
        await handleSubscriptionDisabled(supabaseClient, payload.data)
        break
      default:
        break
    }

    return new Response('Webhook processed successfully', {
      status: 200,
      headers: corsHeaders
    })

  } catch (error) {
    return new Response(`Error processing webhook: ${error.message}`, {
      status: 500,
      headers: corsHeaders
    })
  }
})

async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function handleSubscriptionDisabled(supabaseClient: SupabaseClient, data: PaystackSubscription): Promise<void> {
  if (!data.subscription_code) {
    console.log('[webhook] subscription.disabled event received without a subscription_code.');
    return;
  }
  console.log(`[webhook] Processing subscription.disabled for code: ${data.subscription_code}`);

  const { data: existingSub, error: fetchError } = await supabaseClient
    .from('subscriptions')
    .select('next_payment_date')
    .eq('paystack_subscription_code', data.subscription_code)
    .single();

  if (fetchError || !existingSub) {
    console.error(`[webhook] Failed to find subscription to disable for code: ${data.subscription_code}`, fetchError);
    return;
  }

  const subscriptionUpdateData = {
    status: 'cancelled' as const,
    cancelled_at: new Date().toISOString(),
    end_date: existingSub.next_payment_date,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabaseClient
    .from('subscriptions')
    .update(subscriptionUpdateData)
    .eq('paystack_subscription_code', data.subscription_code);

  if (updateError) {
    console.error(`[webhook] Failed to update subscription to cancelled for code: ${data.subscription_code}`, updateError);
  } else {
    console.log(`[webhook] Successfully updated subscription ${data.subscription_code} to cancelled.`);
  }
}

async function handleChargeSuccess(supabaseClient: SupabaseClient, data: ChargeSuccessData) {
  if (!data.reference || !data.plan?.plan_code) {
    return;
  }

  const subscriptionUpdateData = {
    status: 'active' as const,
    paystack_customer_code: data.customer.customer_code,
    paystack_plan_code: data.plan.plan_code,
    amount: data.amount,
    currency: data.currency,
    current_period_start: data.paid_at,
    current_period_end: new Date(new Date(data.paid_at).setFullYear(new Date(data.paid_at).getFullYear() + 1)).toISOString(),
    start_date: data.paid_at,
    updated_at: new Date().toISOString(),
  };

  const { data: updatedSubscription, error: updateError } = await supabaseClient
    .from('subscriptions')
    .update(subscriptionUpdateData)
    .eq('transaction_reference', data.reference)
    .select()
    .single();

  if (updateError || !updatedSubscription) {
    console.error('Failed to update initial subscription record for reference:', data.reference, updateError);
    return;
  }

  const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!paystackSecret) {
    console.error('Paystack secret key is not configured.');
    return;
  }

  const maxRetries = 5;
  const initialDelay = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await new Promise(resolve => setTimeout(resolve, initialDelay * attempt));

      const apiUrl = `https://api.paystack.co/subscription?customer=${data.customer.id}&plan=${data.plan.id}`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Paystack API error on attempt ${attempt}: ${response.status} - ${errorBody}`);
      }

      const responseData: { status: boolean; message: string; data: PaystackSubscription[] } = await response.json();

      if (responseData.data && responseData.data.length > 0) {
        const activeSubscription = responseData.data
          .filter(sub => sub.status === 'active')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (activeSubscription?.subscription_code) {
          await supabaseClient
            .from('subscriptions')
            .update({
              paystack_subscription_code: activeSubscription.subscription_code,
              next_payment_date: activeSubscription.next_payment_date,
              updated_at: new Date().toISOString(),
            })
            .eq('id', updatedSubscription.id);
          return;
        }
      }
    } catch (fetchError) {
      console.error(`Error fetching subscription code on attempt ${attempt}:`, fetchError);
      if (attempt === maxRetries) {
        console.error('All retry attempts failed for reference:', data.reference);
      }
    }
  }
}