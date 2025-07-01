
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Search, Filter, Heart, Save, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hasChanges, setHasChanges] = useState(false);

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
      setHasChanges(false);
    }
  }, [userPreferences]);

  // Mutation to update user preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (topicIds: string[]) => {
      if (!user?.id) throw new Error('Utente non autenticato');

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
      toast.success('Preferenze aggiornate con successo!');
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Errore nell\'aggiornamento delle preferenze:', error);
      toast.error('Errore nell\'aggiornamento delle preferenze');
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
    setHasChanges(true);
  };

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate(Array.from(selectedTopics));
  };

  const handleResetPreferences = () => {
    if (userPreferences) {
      const preferredTopicIds = new Set(userPreferences.map(pref => pref.topic_id));
      setSelectedTopics(preferredTopicIds);
      setHasChanges(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Effettua il login per gestire i tuoi interessi.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (topicsLoading || preferencesLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Caricamento argomenti...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group topics by category and filter
  const topicsByCategory = topics?.reduce((acc, topic) => {
    // Apply search filter
    if (searchTerm && !topic.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !topic.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return acc;
    }
    
    // Apply category filter
    if (selectedCategory !== 'all' && topic.category !== selectedCategory) {
      return acc;
    }

    if (!acc[topic.category]) {
      acc[topic.category] = [];
    }
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, Topic[]>) || {};

  const categories = topics?.reduce((acc, topic) => {
    if (!acc.includes(topic.category)) {
      acc.push(topic.category);
    }
    return acc;
  }, [] as string[]) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            I Tuoi Interessi
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Seleziona gli argomenti che ti interessano per personalizzare il tuo feed di contenuti.
          </p>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca argomenti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="all">Tutte le categorie</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topics by Category */}
          <div className="space-y-6">
            {Object.entries(topicsByCategory).map(([category, categoryTopics]) => (
              <div key={category} className="space-y-3">
                <h3 className="font-semibold text-lg capitalize flex items-center gap-2">
                  {category.replace('_', ' ')}
                  <Badge variant="secondary" className="text-xs">
                    {categoryTopics.length}
                  </Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className={`flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                        selectedTopics.has(topic.id) 
                          ? 'bg-primary/5 border-primary shadow-sm' 
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => handleTopicToggle(topic.id)}
                    >
                      <Checkbox
                        id={topic.id}
                        checked={selectedTopics.has(topic.id)}
                        onCheckedChange={() => handleTopicToggle(topic.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm leading-tight">{topic.name}</div>
                        {topic.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {topic.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {Object.keys(topicsByCategory).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nessun argomento trovato per i criteri di ricerca.</p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <Heart className="h-3 w-3 text-red-500" />
                {selectedTopics.size} argomenti selezionati
              </Badge>
              {hasChanges && (
                <Badge variant="secondary" className="text-xs">
                  Modifiche non salvate
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {hasChanges && (
                <Button 
                  variant="outline"
                  onClick={handleResetPreferences}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Annulla
                </Button>
              )}
              <Button 
                onClick={handleSavePreferences}
                disabled={updatePreferencesMutation.isPending || !hasChanges}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {updatePreferencesMutation.isPending ? 'Salvataggio...' : 'Salva Preferenze'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopicSelector;
