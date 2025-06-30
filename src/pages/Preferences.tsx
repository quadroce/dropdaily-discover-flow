
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import TopicSelector from '@/components/TopicSelector';
import TopicSeeder from '@/components/TopicSeeder';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Preferences = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              Please log in to manage your preferences.
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Preferences</h1>
            <p className="text-gray-600">
              Customize your content experience by selecting your interests.
            </p>
          </div>
          
          <div className="space-y-6">
            <TopicSeeder />
            <TopicSelector />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
