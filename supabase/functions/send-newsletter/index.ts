import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from 'https://esm.sh/resend@4.0.0';

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

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    const resend = new Resend(resendApiKey);

    console.log('Starting newsletter generation...');

    // Get all users with preferences
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name
      `)
      .not('email', 'is', null);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    console.log(`Found ${users?.length || 0} users`);

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users found to send newsletter to',
          users_processed: 0 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let emailsSent = 0;
    let emailsSkipped = 0;

    for (const user of users) {
      try {
        console.log(`Processing user: ${user.email}`);

        // Get user preferences
        const { data: preferences } = await supabaseClient
          .from('user_preferences')
          .select(`
            topic_id,
            weight,
            topic:topics(*)
          `)
          .eq('user_id', user.id);

        if (!preferences || preferences.length === 0) {
          console.log(`No preferences found for user ${user.email}`);
          emailsSkipped++;
          continue;
        }

        console.log(`User ${user.email} has ${preferences.length} preferences`);

        // Get recent content matching user preferences
        const topicIds = preferences.map(p => p.topic_id);
        
        const { data: recentContent } = await supabaseClient
          .from('content_topics')
          .select(`
            content:content(
              id,
              title,
              description,
              url,
              published_at,
              source,
              content_type
            ),
            relevance_score,
            topic_id
          `)
          .in('topic_id', topicIds)
          .gte('content.published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days instead of 24 hours
          .order('content.published_at', { ascending: false })
          .limit(20);

        if (!recentContent || recentContent.length === 0) {
          console.log(`No recent content found for user ${user.email}`);
          
          // Send a newsletter anyway with a message about no new content
          const noContentHtml = generateNoContentNewsletterHtml(user);
          
          const emailResponse = await resend.emails.send({
            from: 'DropDaily <newsletter@resend.dev>',
            to: [user.email],
            subject: `La tua newsletter DropDaily - ${new Date().toLocaleDateString('it-IT')}`,
            html: noContentHtml
          });

          if (emailResponse.error) {
            console.error(`Error sending no-content email to ${user.email}:`, emailResponse.error);
          } else {
            console.log(`No-content newsletter sent successfully to ${user.email}`);
            emailsSent++;
          }
          continue;
        }

        // Score content based on user preferences
        const scoredContent = recentContent
          .map(item => {
            const userPref = preferences.find(p => p.topic_id === item.topic_id);
            const score = (userPref?.weight || 1) * (item.relevance_score || 1);
            return {
              ...item.content,
              score,
              topic: userPref?.topic
            };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        console.log(`Selected ${scoredContent.length} content items for ${user.email}`);

        // Generate newsletter HTML
        const newsletterHtml = generateNewsletterHtml(user, scoredContent);

        // Send email
        const emailResponse = await resend.emails.send({
          from: 'DropDaily <newsletter@resend.dev>',
          to: [user.email],
          subject: `La tua newsletter DropDaily - ${new Date().toLocaleDateString('it-IT')}`,
          html: newsletterHtml
        });

        if (emailResponse.error) {
          console.error(`Error sending email to ${user.email}:`, emailResponse.error);
          emailsSkipped++;
        } else {
          console.log(`Newsletter sent successfully to ${user.email}`);
          emailsSent++;
        }

      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        emailsSkipped++;
        continue;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Newsletter sending completed',
        users_processed: users.length,
        emails_sent: emailsSent,
        emails_skipped: emailsSkipped
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-newsletter function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

function generateNoContentNewsletterHtml(user: any): string {
  const userName = user.first_name || 'Caro lettore';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>La tua newsletter DropDaily</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e9ecef;
            }
            .header h1 {
                color: #2563eb;
                margin: 0;
                font-size: 28px;
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 25px;
                color: #495057;
            }
            .no-content {
                text-align: center;
                padding: 40px 20px;
                background: #f8f9fa;
                border-radius: 8px;
                margin: 20px 0;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                text-align: center;
                color: #868e96;
                font-size: 14px;
            }
            .cta-button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 10px 5px;
                font-weight: 500;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📰 DropDaily</h1>
                <p>${new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div class="greeting">
                Ciao ${userName}! 👋
            </div>
            
            <div class="no-content">
                <h2>🔍 Nessun nuovo contenuto oggi</h2>
                <p>Non abbiamo trovato nuovi contenuti che corrispondono ai tuoi interessi nelle ultime 24 ore.</p>
                <p>Prova ad ampliare i tuoi interessi o torna domani per nuovi contenuti!</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://').replace('.supabase.co', '.supabase.co')}/preferences" class="cta-button">
                    Gestisci le tue preferenze
                </a>
            </div>
            
            <div class="footer">
                <p>Questa newsletter è stata generata automaticamente in base ai tuoi interessi.</p>
                <p>Per modificare le tue preferenze o annullare l'iscrizione, visita il tuo profilo.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateNewsletterHtml(user: any, content: any[]): string {
  const userName = user.first_name || 'Caro lettore';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>La tua newsletter DropDaily</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e9ecef;
            }
            .header h1 {
                color: #2563eb;
                margin: 0;
                font-size: 28px;
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 25px;
                color: #495057;
            }
            .content-item {
                margin-bottom: 25px;
                padding: 20px;
                border: 1px solid #e9ecef;
                border-radius: 6px;
                background: #fafbfc;
            }
            .content-item h3 {
                margin: 0 0 10px 0;
                color: #2563eb;
                font-size: 18px;
            }
            .content-item h3 a {
                color: #2563eb;
                text-decoration: none;
            }
            .content-item h3 a:hover {
                text-decoration: underline;
            }
            .content-item p {
                margin: 0 0 10px 0;
                color: #6c757d;
            }
            .source {
                font-size: 12px;
                color: #868e96;
                font-style: italic;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                text-align: center;
                color: #868e96;
                font-size: 14px;
            }
            .cta-button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 10px 5px;
                font-weight: 500;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📰 La tua newsletter DropDaily</h1>
                <p>${new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div class="greeting">
                Ciao ${userName}! 👋<br>
                Ecco i contenuti selezionati appositamente per te in base ai tuoi interessi:
            </div>
            
            ${content.map((item, index) => `
                <div class="content-item">
                    <h3><a href="${item.url}" target="_blank">${item.title}</a></h3>
                    <p>${item.description || 'Nessuna descrizione disponibile'}</p>
                    <div class="source">Fonte: ${item.source || 'Sconosciuta'} • ${item.topic?.name || 'Generale'}</div>
                </div>
            `).join('')}
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://').replace('.supabase.co', '.supabase.co')}/preferences" class="cta-button">
                    Gestisci le tue preferenze
                </a>
            </div>
            
            <div class="footer">
                <p>Questa newsletter è stata generata automaticamente in base ai tuoi interessi.</p>
                <p>Per modificare le tue preferenze o annullare l'iscrizione, visita il tuo profilo.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

serve(handler);