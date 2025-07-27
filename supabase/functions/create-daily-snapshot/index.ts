// supabase/functions/create-daily-snapshot/index.ts
import { serve } from "https://deno.land/std@0.202.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Admin client for server-side operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (_req) => {
  try {
    // 1. Fetch all profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, cash, fans');

    if (profileError) {
      throw profileError;
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: 'No profiles found to snapshot.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Prepare the snapshot data
    const snapshots = profiles.map(profile => ({
      profile_id: profile.id,
      snapshot_date: new Date().toISOString().split('T')[0], // Get YYYY-MM-DD
      cash_balance: profile.cash,
      fans_count: profile.fans,
    }));

    // 3. Upsert the snapshots into the daily_profile_snapshots table
    //    `upsert` will insert new rows or update existing ones if a conflict on `profile_id` and `snapshot_date` occurs.
    const { error: snapshotError } = await supabaseAdmin
      .from('daily_profile_snapshots')
      .upsert(snapshots, { onConflict: 'profile_id, snapshot_date' });

    if (snapshotError) {
      throw snapshotError;
    }

    return new Response(JSON.stringify({ message: `Successfully created ${snapshots.length} snapshots.` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Error creating daily snapshots:', err.message);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
