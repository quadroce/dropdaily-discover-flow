import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

// Logger utility for edge functions
const createEdgeLogger = (functionName: string, userId?: string) => {
  const startTime = Date.now();
  
  const log = async (level: string, action: string, message: string, details?: any) => {
    const executionTime = Date.now() - startTime;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    try {
      await supabaseClient.from('system_logs').insert({
        user_id: userId || null,
        action,
        status: level,
        message,
        details: details || null,
        function_name: functionName,
        execution_time_ms: executionTime
      });
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  };

  return {
    success: (action: string, message: string, details?: any) => log('success', action, message, details),
    error: (action: string, message: string, details?: any) => log('error', action, message, details),
    warning: (action: string, message: string, details?: any) => log('warning', action, message, details),
    info: (action: string, message: string, details?: any) => log('info', action, message, details)
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get user ID from request headers
  const authHeader = req.headers.get('authorization');
  let userId: string | undefined;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id;
    } catch (error) {
      console.error('Error getting user from token:', error);
    }
  }

  const logger = createEdgeLogger('test-newsletter', userId);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await logger.info('test_started', 'Avvio del test di newsletter');
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
    let totalPreferences = 0;
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
        totalPreferences += preferences?.length || 0;
        if (prefsError) {
          console.error(`Preferences error for ${user.email}:`, prefsError);
        }
      }
    }

    // Test 3: Check content availability
    const { data: recentContent, error: contentError } = await supabaseClient
      .from('content')
      .select('id, title, published_at, source')
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('published_at', { ascending: false })
      .limit(10);

    console.log('Recent content found (last 7 days):', recentContent?.length || 0);
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
      .gte('content.published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
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

    // Test 6: Check topics database
    const { data: topics, error: topicsError } = await supabaseClient
      .from('topics')
      .select('id, name, category')
      .limit(5);

    console.log('Topics in database:', topics?.length || 0);
    if (topicsError) {
      console.error('Topics error:', topicsError);
    }

    const logData = {
      timestamp: new Date().toISOString(),
      users_count: users?.length || 0,
      total_preferences: totalPreferences,
      content_count: recentContent?.length || 0,
      content_topics_count: contentTopics?.length || 0,
      topics_count: topics?.length || 0,
      api_keys: {
        resend: !!resendKey,
        firecrawl: !!firecrawlKey
      },
      users: users?.map(u => ({ email: u.email, id: u.id })) || [],
      recent_content: recentContent?.map(c => ({ title: c.title, published_at: c.published_at })) || [],
      recommendations: []
    };

    // Add recommendations based on findings
    if (logData.users_count === 0) {
      logData.recommendations.push("No users found - make sure users are registered and have profiles");
    }
    if (logData.total_preferences === 0) {
      logData.recommendations.push("No user preferences found - users need to configure their interests");
    }
    if (logData.content_count === 0) {
      logData.recommendations.push("No recent content found - run content collection to populate database");
    }
    if (logData.topics_count === 0) {
      logData.recommendations.push("No topics found - run topic seeder to populate topics database");
    }
    if (!logData.api_keys.resend) {
      logData.recommendations.push("RESEND_API_KEY not configured - email sending will fail");
    }

    console.log('=== TEST COMPLETED ===');
    console.log('Recommendations:', logData.recommendations);

    await logger.success('test_completed', 'Test della newsletter completato con successo', logData);

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
    await logger.error('test_failed', `Errore durante il test: ${error.message}`, { error: error.toString() });
    
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