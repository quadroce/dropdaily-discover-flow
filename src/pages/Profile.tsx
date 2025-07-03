
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, ArrowLeft, Settings, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import SystemLogs from '@/components/SystemLogs';

const Profile = () => {
  const { user, loading, signOut, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // If user is not authenticated, redirect to auth page
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || '');
      }
    };

    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await updateProfile(firstName, lastName);
    
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your account information and preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-sm text-gray-500">
                  Email cannot be changed from this interface
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Profile...
                  </>
                ) : (
                  'Update Profile'
                )}
              </Button>
            </form>

            {/* Preferences Section */}
            <div className="border-t pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    I Tuoi Interessi
                  </h3>
                  <p className="text-sm text-gray-500">Gestisci gli argomenti che ti interessano</p>
                </div>
                <Link to="/preferences">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Modifica Preferenze
                  </Button>
                </Link>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Account Actions</h3>
                  <p className="text-sm text-gray-500">Manage your account</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Logs Section */}
        <div className="mt-8">
          <SystemLogs />
        </div>
      </div>
    </div>
  );
};

export default Profile;
