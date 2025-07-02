import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting daily newsletter cron job...');

    // Step 1: Collect new content
    const collectResponse = await supabaseClient.functions.invoke('collect-content');
    console.log('Content collection response:', collectResponse);

    // Wait a bit for content processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 2: Send newsletters
    const newsletterResponse = await supabaseClient.functions.invoke('send-newsletter');
    console.log('Newsletter sending response:', newsletterResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Daily newsletter cron completed',
        collectResponse: collectResponse.data,
        newsletterResponse: newsletterResponse.data
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in daily-newsletter-cron function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);