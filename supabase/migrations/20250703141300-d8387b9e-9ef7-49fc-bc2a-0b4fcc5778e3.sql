-- Create logs table for system activity tracking
CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning', 'info')),
  message TEXT NOT NULL,
  details JSONB,
  function_name TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own logs" 
ON public.system_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert logs" 
ON public.system_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_system_logs_user_id_created_at ON public.system_logs(user_id, created_at DESC);
CREATE INDEX idx_system_logs_status_created_at ON public.system_logs(status, created_at DESC);