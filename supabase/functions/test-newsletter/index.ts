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

    console.log('=== NEWSLETTER TEST DEBUG ===');
    
    // Test 1: Check if users exist
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id, email, first_name, last_name')
      .not('email', 'is', null);

    console.log('Users found:', users?.length || 0);
    if (usersError) {
      console.error('Users error:', usersError);
    }
    users?.forEach(user => {
      console.log(`- User: ${user.email} (${user.first_name} ${user.last_name})`);
    });

    // Test 2: Check if users have preferences
    if (users && users.length > 0) {
      for (const user of users) {
        const { data: preferences, error: prefsError } = await supabaseClient
          .from('user_preferences')
          .select(`
            topic_id,
            weight,
            topic:topics(name, category)
          `)
          .eq('user_id', user.id);

        console.log(`User ${user.email} preferences:`, preferences?.length || 0);
        if (prefsError) {
          console.error(`Preferences error for ${user.email}:`, prefsError);
        }
      }
    }

    // Test 3: Check content availability
    const { data: recentContent, error: contentError } = await supabaseClient
      .from('content')
      .select('id, title, published_at, source')
      .gte('published_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('published_at', { ascending: false })
      .limit(10);

    console.log('Recent content found:', recentContent?.length || 0);
    if (contentError) {
      console.error('Content error:', contentError);
    }
    recentContent?.forEach(content => {
      console.log(`- Content: ${content.title} (${new Date(content.published_at).toLocaleString()})`);
    });

    // Test 4: Check content-topics mapping
    const { data: contentTopics, error: ctError } = await supabaseClient
      .from('content_topics')
      .select(`
        content:content(title, published_at),
        topic:topics(name),
        relevance_score
      `)
      .gte('content.published_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    console.log('Content-topics mappings found:', contentTopics?.length || 0);
    if (ctError) {
      console.error('Content-topics error:', ctError);
    }

    // Test 5: Check API keys
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    console.log('RESEND_API_KEY exists:', !!resendKey);
    console.log('FIRECRAWL_API_KEY exists:', !!firecrawlKey);

    // Test 6: Try calling collect-content function
    console.log('Testing collect-content function...');
    try {
      const { data: collectData, error: collectError } = await supabaseClient.functions.invoke('collect-content');
      console.log('Collect-content response:', collectData);
      if (collectError) {
        console.error('Collect-content error:', collectError);
      }
    } catch (error) {
      console.error('Failed to call collect-content:', error);
    }

    const logData = {
      timestamp: new Date().toISOString(),
      users_count: users?.length || 0,
      content_count: recentContent?.length || 0,
      content_topics_count: contentTopics?.length || 0,
      api_keys: {
        resend: !!resendKey,
        firecrawl: !!firecrawlKey
      },
      users: users?.map(u => ({ email: u.email, id: u.id })) || [],
      recent_content: recentContent?.map(c => ({ title: c.title, published_at: c.published_at })) || []
    };

    console.log('=== TEST COMPLETED ===');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Newsletter test completed - check logs for details',
        summary: logData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in test-newsletter function:', error);
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