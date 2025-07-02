import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentSource {
  url: string;
  type: 'rss' | 'website' | 'blog';
  category: string;
}

const defaultSources: ContentSource[] = [
  { url: 'https://techcrunch.com', type: 'website', category: 'tecnologia' },
  { url: 'https://www.wired.com', type: 'website', category: 'tecnologia' },
  { url: 'https://medium.com', type: 'website', category: 'general' },
  { url: 'https://dev.to', type: 'website', category: 'programmazione' },
  { url: 'https://news.ycombinator.com', type: 'website', category: 'tecnologia' },
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const firecrawl = new FirecrawlApp({
      apiKey: Deno.env.get('FIRECRAWL_API_KEY')
    });

    console.log('Starting content collection...');
    
    for (const source of defaultSources) {
      try {
        console.log(`Crawling ${source.url}...`);
        
        const crawlResponse = await firecrawl.crawlUrl(source.url, {
          limit: 10,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          }
        });

        if (crawlResponse.success && crawlResponse.data) {
          for (const page of crawlResponse.data) {
            if (page.markdown && page.metadata?.title) {
              // Check if content already exists
              const { data: existingContent } = await supabaseClient
                .from('content')
                .select('id')
                .eq('url', page.metadata.sourceURL)
                .single();

              if (!existingContent) {
                // Insert new content
                const { data: contentData, error: contentError } = await supabaseClient
                  .from('content')
                  .insert({
                    title: page.metadata.title,
                    description: page.metadata.description || page.markdown.substring(0, 200),
                    url: page.metadata.sourceURL,
                    source: source.url,
                    content_type: 'article',
                    published_at: new Date().toISOString()
                  })
                  .select()
                  .single();

                if (contentError) {
                  console.error('Error inserting content:', contentError);
                  continue;
                }

                // Find matching topic
                const { data: topics } = await supabaseClient
                  .from('topics')
                  .select('id')
                  .eq('category', source.category)
                  .limit(1);

                if (topics && topics.length > 0) {
                  // Link content to topic
                  await supabaseClient
                    .from('content_topics')
                    .insert({
                      content_id: contentData.id,
                      topic_id: topics[0].id,
                      relevance_score: 1.0
                    });
                }

                console.log(`Added content: ${page.metadata.title}`);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error crawling ${source.url}:`, error);
        continue;
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Content collection completed' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in collect-content function:', error);
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