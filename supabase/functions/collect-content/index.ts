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

interface ContentSource {
  url: string;
  type: 'rss' | 'website' | 'blog';
  category: string;
  topics: string[];
}

// Sample content to populate the database for testing
const sampleContent = [
  {
    title: "What can I expect moving to Milan as a guy in my mid-20s?",
    url: "https://www.reddit.com/r/milano/comments/1llpits/what_can_i_expect_moving_to_milan_as_a_guy_in_my/",
    description: "Discussion about moving to Milan for young professionals",
    source: "Reddit - r/milano",
    content_type: "reddit_thread",
    topics: ["Culture & Society", "World & Politics"]
  },
  {
    title: "Cambiare settore? No grazie",
    url: "https://www.linkedin.com/news/story/cambiare-settore-no-grazie-6448388/",
    description: "Analysis of career changes in the current job market",
    source: "LinkedIn News",
    content_type: "article",
    topics: ["Finance & Economy", "Education & Learning"]
  },
  {
    title: "This AI-powered startup studio plans to launch 100,000 companies a year. Really.",
    url: "https://techcrunch.com/2025/06/26/this-ai-powered-startup-studio-plans-to-launch-100000-companies-a-year-really/",
    description: "TechCrunch article about AI-powered startup acceleration",
    source: "TechCrunch",
    content_type: "article",
    topics: ["Tech & Innovation", "Finance & Economy"]
  },
  {
    title: "Wimbledon: sorteggio Sinner debutta contro Nardi",
    url: "https://www.gazzetta.it/Tennis/atp/slam/wimbledon/27-06-2025/wimbledon-sorteggio-sinner-debutta-contro-nardi-nei-quarti-possibile-derby-con-musetti.shtml",
    description: "Wimbledon tennis tournament draw and match predictions",
    source: "Gazzetta dello Sport",
    content_type: "news",
    topics: ["Sports"]
  },
  {
    title: "Dan Pat Rugby Training",
    url: "https://www.youtube.com/watch?v=UYKV0LXfj8k",
    description: "Rugby training techniques and drills",
    source: "YouTube",
    content_type: "video",
    topics: ["Sports", "Wellness & Lifestyle"]
  },
  {
    title: "The Future of AI in Healthcare",
    url: "https://example.com/ai-healthcare",
    description: "How artificial intelligence is revolutionizing medical diagnosis and treatment",
    source: "Tech Health Magazine",
    content_type: "article",
    topics: ["Tech & Innovation", "Science & Nature"]
  },
  {
    title: "Sustainable Living: 10 Easy Changes You Can Make Today",
    url: "https://example.com/sustainable-living",
    description: "Practical tips for reducing your environmental footprint",
    source: "Green Living Blog",
    content_type: "article",
    topics: ["Science & Nature", "Wellness & Lifestyle"]
  },
  {
    title: "Market Analysis: Tech Stocks in 2025",
    url: "https://example.com/tech-stocks-2025",
    description: "Investment insights and predictions for technology sector",
    source: "Financial Times",
    content_type: "article",
    topics: ["Finance & Economy", "Tech & Innovation"]
  }
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createEdgeLogger('collect-content');

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await logger.info('content_collection_started', 'Avvio raccolta contenuti');
    console.log('Starting content collection...');
    
    let contentAdded = 0;
    let contentSkipped = 0;

    for (const contentItem of sampleContent) {
      try {
        // Check if content already exists
        const { data: existingContent } = await supabaseClient
          .from('content')
          .select('id')
          .eq('url', contentItem.url)
          .single();

        if (existingContent) {
          console.log(`Content already exists: ${contentItem.title}`);
          contentSkipped++;
          continue;
        }

        // Insert new content
        const { data: newContent, error: contentError } = await supabaseClient
          .from('content')
          .insert({
            title: contentItem.title,
            description: contentItem.description,
            url: contentItem.url,
            source: contentItem.source,
            content_type: contentItem.content_type as any,
            published_at: new Date().toISOString()
          })
          .select()
          .single();

        if (contentError) {
          console.error('Error inserting content:', contentError);
          continue;
        }

        console.log(`Added content: ${contentItem.title}`);
        contentAdded++;

        // Link content to topics
        for (const topicCategory of contentItem.topics) {
          const { data: topics } = await supabaseClient
            .from('topics')
            .select('id')
            .eq('category', topicCategory)
            .limit(1);

          if (topics && topics.length > 0) {
            const { error: linkError } = await supabaseClient
              .from('content_topics')
              .insert({
                content_id: newContent.id,
                topic_id: topics[0].id,
                relevance_score: 1.0
              });

            if (linkError) {
              console.error('Error linking content to topic:', linkError);
            } else {
              console.log(`Linked content to topic: ${topicCategory}`);
            }
          }
        }

      } catch (error) {
        console.error(`Error processing content ${contentItem.title}:`, error);
        continue;
      }
    }

    const result = {
      content_added: contentAdded,
      content_skipped: contentSkipped,
      total_processed: sampleContent.length
    };

    await logger.success('content_collection_completed', 'Raccolta contenuti completata', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Content collection completed',
        ...result
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in collect-content function:', error);
    await logger.error('content_collection_failed', `Errore durante la raccolta: ${error.message}`, { error: error.toString() });
    
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