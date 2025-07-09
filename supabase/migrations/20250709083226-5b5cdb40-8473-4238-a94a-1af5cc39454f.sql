-- Add fields to content table for aggregation engine
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL,
ADD COLUMN IF NOT EXISTS scraping_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS excerpt TEXT,
ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_reviewed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending'; -- pending, approved, rejected

-- Create aggregation_jobs table for tracking scraping tasks
CREATE TABLE IF NOT EXISTS public.aggregation_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keywords TEXT NOT NULL,
  content_types TEXT[] NOT NULL,
  date_range_start TIMESTAMP WITH TIME ZONE,
  date_range_end TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  total_found INTEGER DEFAULT 0,
  total_saved INTEGER DEFAULT 0,
  total_duplicates INTEGER DEFAULT 0,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create scraping_schedules table for automated tasks
CREATE TABLE IF NOT EXISTS public.scraping_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  keywords TEXT NOT NULL,
  content_types TEXT[] NOT NULL,
  cron_expression TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create aggregation_logs table for detailed logging
CREATE TABLE IF NOT EXISTS public.aggregation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.aggregation_jobs(id) ON DELETE CASCADE,
  level TEXT NOT NULL, -- info, warning, error
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.aggregation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for aggregation tables (admin only access)
CREATE POLICY "Authenticated users can manage aggregation jobs" ON public.aggregation_jobs FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage scraping schedules" ON public.scraping_schedules FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can view aggregation logs" ON public.aggregation_logs FOR SELECT TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX idx_aggregation_jobs_status ON public.aggregation_jobs(status);
CREATE INDEX idx_aggregation_jobs_created_at ON public.aggregation_jobs(created_at);
CREATE INDEX idx_content_scraping_status ON public.content(scraping_status);
CREATE INDEX idx_content_review_status ON public.content(review_status);
CREATE INDEX idx_scraping_schedules_active ON public.scraping_schedules(is_active);
CREATE INDEX idx_aggregation_logs_job_id ON public.aggregation_logs(job_id);

-- Add updated_at trigger for scraping_schedules
CREATE TRIGGER update_scraping_schedules_updated_at
  BEFORE UPDATE ON public.scraping_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();