
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Topic {
  id: string;
  slug: string;
  name: string;
  category: string;
  parent_category: string | null;
  description: string | null;
}

interface UserPreference {
  id: string;
  user_id: string;
  topic_id: string;
  weight: number;
  topic: Topic;
}

const TopicSelector = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());

  // Fetch all topics
  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as Topic[];
    }
  });

  // Fetch user preferences
  const { data: userPreferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select(`
          *,
          topic:topics(*)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as UserPreference[];
    },
    enabled: !!user?.id
  });

  // Update selected topics when user preferences load
  useEffect(() => {
    if (userPreferences) {
      const preferredTopicIds = new Set(userPreferences.map(pref => pref.topic_id));
      setSelectedTopics(preferredTopicIds);
    }
  }, [userPreferences]);

  // Mutation to update user preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (topicIds: string[]) => {
      if (!user?.id) throw new Error('User not authenticated');

      // First, delete all existing preferences for this user
      const { error: deleteError } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Then insert new preferences
      if (topicIds.length > 0) {
        const preferences = topicIds.map(topicId => ({
          user_id: user.id,
          topic_id: topicId,
          weight: 1.0
        }));

        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert(preferences);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      toast.success('Preferences updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  });

  const handleTopicToggle = (topicId: string) => {
    const newSelected = new Set(selectedTopics);
    if (newSelected.has(topicId)) {
      newSelected.delete(topicId);
    } else {
      newSelected.add(topicId);
    }
    setSelectedTopics(newSelected);
  };

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate(Array.from(selectedTopics));
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please log in to manage your topic preferences.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (topicsLoading || preferencesLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center">Loading topics...</p>
        </CardContent>
      </Card>
    );
  }

  // Group topics by category
  const topicsByCategory = topics?.reduce((acc, topic) => {
    if (!acc[topic.category]) {
      acc[topic.category] = [];
    }
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, Topic[]>) || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Interests</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select topics you're interested in to personalize your content feed.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(topicsByCategory).map(([category, categoryTopics]) => (
              <div key={category} className="space-y-3">
                <h3 className="font-semibold text-lg capitalize">{category.replace('_', ' ')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        id={topic.id}
                        checked={selectedTopics.has(topic.id)}
                        onCheckedChange={() => handleTopicToggle(topic.id)}
                      />
                      <label
                        htmlFor={topic.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{topic.name}</div>
                        {topic.description && (
                          <div className="text-sm text-muted-foreground">
                            {topic.description}
                          </div>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <div className="flex gap-2">
              <Badge variant="secondary">
                {selectedTopics.size} topics selected
              </Badge>
            </div>
            <Button 
              onClick={handleSavePreferences}
              disabled={updatePreferencesMutation.isPending}
            >
              {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopicSelector;
