
-- Enable the pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum for content types
CREATE TYPE content_type AS ENUM ('article', 'video', 'reddit_thread', 'discussion', 'news');

-- Create topics table to store the hierarchical taxonomy
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  parent_category TEXT,
  description TEXT,
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user preferences table to store user-topic relationships
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL DEFAULT 1.0, -- For future fine-tuning based on user behavior
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- Create content table to store articles, videos, etc.
CREATE TABLE public.content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT,
  content_type content_type NOT NULL,
  source TEXT,
  description TEXT,
  embedding VECTOR(1536), -- Content embedding for similarity matching
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content topics junction table (many-to-many)
CREATE TABLE public.content_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
  relevance_score DECIMAL DEFAULT 1.0, -- How relevant this topic is to the content
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_id, topic_id)
);

-- Create user profile vectors table for fast similarity searches
CREATE TABLE public.user_profile_vectors (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  profile_embedding VECTOR(1536), -- Aggregated user interest vector
  topics_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_topics_category ON public.topics(category);
CREATE INDEX idx_topics_slug ON public.topics(slug);
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_content_topics_content_id ON public.content_topics(content_id);
CREATE INDEX idx_content_topics_topic_id ON public.content_topics(topic_id);
CREATE INDEX idx_content_type ON public.content(content_type);
CREATE INDEX idx_content_published_at ON public.content(published_at);

-- Create vector similarity index (requires pgvector extension)
-- This will be used for fast similarity searches
CREATE INDEX ON public.user_profile_vectors USING ivfflat (profile_embedding vector_cosine_ops);
CREATE INDEX ON public.content USING ivfflat (embedding vector_cosine_ops);

-- Enable Row Level Security
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile_vectors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topics (public read, admin write)
CREATE POLICY "Anyone can view topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert topics" ON public.topics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update topics" ON public.topics FOR UPDATE TO authenticated USING (true);

-- RLS Policies for user preferences (users can only manage their own)
CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own preferences" ON public.user_preferences FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for content (public read for now)
CREATE POLICY "Anyone can view content" ON public.content FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert content" ON public.content FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for content topics (public read)
CREATE POLICY "Anyone can view content topics" ON public.content_topics FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage content topics" ON public.content_topics FOR ALL TO authenticated USING (true);

-- RLS Policies for user profile vectors
CREATE POLICY "Users can view their own profile vector" ON public.user_profile_vectors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile vector" ON public.user_profile_vectors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile vector" ON public.user_profile_vectors FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update user profile vector when preferences change
CREATE OR REPLACE FUNCTION update_user_profile_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called by an edge function to recalculate embeddings
  -- For now, just update the timestamp and topic count
  INSERT INTO public.user_profile_vectors (user_id, topics_count, last_updated)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    (SELECT COUNT(*) FROM public.user_preferences WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    topics_count = EXCLUDED.topics_count,
    last_updated = EXCLUDED.last_updated;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update user profile vector when preferences change  
CREATE TRIGGER on_user_preferences_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_user_profile_vector();
