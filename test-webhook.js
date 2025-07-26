const crypto = require('crypto');

// Test webhook payload (simulating a charge.success event)
const testPayload = {
  event: "charge.success",
  data: {
    reference: "test_ref_" + Date.now(),
    amount: 299900, // Monthly plan in kobo
    status: "success",
    customer: {
      customer_code: "CUS_test_customer_123",
      email: "test@example.com"
    },
    plan: {
      plan_code: "PLN_ngi7zlmtuwfjd4e", // Monthly plan
      interval: "monthly"
    }
  }
};

// Function to generate Paystack webhook signature
function generatePaystackSignature(payload, secret) {
  return crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Test function
async function testWebhook() {
  const webhookUrl = 'https://vejkcysxjhuotptwjtjs.supabase.co/functions/v1/paystack-webhook';
  const paystackSecret = 'your_paystack_secret_key_here'; // Replace with actual secret
  
  const signature = generatePaystackSignature(testPayload, paystackSecret);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': signature
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response Body:', result);
    
    if (response.status === 200) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed');
    }
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
}

// Run the test (uncomment the line below after fixing the JWT issue)
// testWebhook();

console.log('Test payload created. Run testWebhook() after fixing the JWT verification issue.');
console.log('Webhook URL: https://vejkcysxjhuotptwjtjs.supabase.co/functions/v1/paystack-webhook');
console.log('Expected signature header: x-paystack-signature'); 