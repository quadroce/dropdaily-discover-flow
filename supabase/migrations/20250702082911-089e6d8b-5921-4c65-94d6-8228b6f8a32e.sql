-- Set up cron job to run daily newsletter at 8:00 AM Milan time
-- First enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the daily newsletter cron job
-- 8:00 AM Milan time = 6:00 AM UTC (during standard time) or 7:00 AM UTC (during daylight time)
-- Using 7:00 AM UTC to account for daylight saving time
SELECT cron.schedule(
  'daily-newsletter-8am-milan',
  '0 7 * * *', -- Every day at 7:00 AM UTC (8:00 AM Milan time)
  $$
  SELECT
    net.http_post(
      url := 'https://dmymonzjfrirwxyqyqye.supabase.co/functions/v1/daily-newsletter-cron',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRteW1vbnpqZnJpcnd4eXF5cXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODc0ODMsImV4cCI6MjA2NjI2MzQ4M30.QZb6qq8ExToGfVbwwnIMsfoTWih0uez55Dfdp173mbs"}'::jsonb,
      body := '{"time": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);