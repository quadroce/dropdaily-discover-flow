import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ExternalLink, 
  Twitter, 
  Linkedin, 
  Copy, 
  Heart,
  Clock,
  User,
  Share
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock public profile data
const mockPublicProfile = {
  username: 'francesco',
  displayName: 'Francesco Rossi',
  tagline: "Here's what Francesco is discovering this week",
  avatar: null,
  joinedDate: '2024-01-01',
  isPublic: true
};

// Mock public content
const mockPublicContent = [
  {
    id: 1,
    title: "The Future of AI in Content Creation",
    excerpt: "How artificial intelligence is revolutionizing the way we create and consume digital content...",
    source: "Medium",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop",
    url: "https://example.com/ai-content",
    type: "article",
    likedAt: "2024-01-15",
    isLiked: true
  },
  {
    id: 2,
    title: "Building React Components Like a Pro",
    excerpt: "Advanced patterns and best practices for creating reusable React components that scale...",
    source: "YouTube",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop",
    url: "https://example.com/react-video",
    type: "video",
    savedAt: "2024-01-14",
    isLiked: false
  },
  {
    id: 3,
    title: "The Hidden Psychology of UX Design",
    excerpt: "Understanding cognitive biases and psychological principles that make interfaces more intuitive...",
    source: "Design Blog",
    image: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&h=200&fit=crop",
    url: "https://example.com/ux-psychology",
    type: "article",
    likedAt: "2024-01-13",
    isLiked: true
  },
  {
    id: 4,
    title: "Advanced TypeScript Patterns",
    excerpt: "Mastering conditional types, mapped types, and template literal types...",
    source: "Dev Blog",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop",
    url: "https://example.com/typescript",
    type: "article",
    savedAt: "2024-01-12",
    isLiked: false
  }
];

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState(mockPublicProfile);
  const [content, setContent] = useState(mockPublicContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch public profile
    const fetchPublicProfile = async () => {
      try {
        // In a real app, you'd fetch the profile data here
        // const response = await supabase.from('profiles').select('*').eq('username', username).single();
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching public profile:', error);
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [username]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Profile link has been copied to your clipboard.",
    });
  };

  const handleShare = (platform: 'twitter' | 'linkedin') => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out ${profile.displayName}'s curated content on DropDaily`);
    
    let shareUrl = '';
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    } else if (platform === 'linkedin') {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    }
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile.isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Profile Not Public</h1>
          <p className="text-muted-foreground mb-6">
            This user has chosen to keep their profile private.
          </p>
          <Button asChild>
            <a href="/">Back to DropDaily</a>
          </Button>
        </div>
      </div>
    );
  }

  const initials = profile.displayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();

  const likedContent = content.filter(item => item.isLiked);
  const savedContent = content.filter(item => !item.isLiked);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="text-xl font-semibold text-foreground">
              DropDaily
            </a>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare('twitter')}>
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')}>
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="text-center mb-12">
          <Avatar className="w-24 h-24 mx-auto mb-4">
            <AvatarImage src={profile.avatar || undefined} alt={profile.displayName} />
            <AvatarFallback className="text-2xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {profile.displayName}
          </h1>
          
          <p className="text-lg text-muted-foreground mb-4">
            {profile.tagline}
          </p>
          
          <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              <span>@{profile.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Joined {new Date(profile.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          {/* Recently Liked */}
          {likedContent.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Recently Liked
              </h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                {likedContent.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">{item.source}</Badge>
                        <Badge variant="outline" className="text-xs">{item.type}</Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {item.excerpt}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Liked {new Date(item.likedAt).toLocaleDateString()}
                        </span>
                        <Button size="sm" variant="outline" asChild>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Read
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Recently Saved */}
          {savedContent.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recently Saved
              </h2>
              
              <div className="grid gap-4">
                {savedContent.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-24 h-16 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">{item.source}</Badge>
                            <Badge variant="outline" className="text-xs">{item.type}</Badge>
                          </div>
                          <h3 className="font-medium text-foreground mb-1 line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.excerpt}
                          </p>
                        </div>
                        <div className="flex flex-col justify-between items-end">
                          <Button size="sm" variant="outline" asChild>
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <span className="text-xs text-muted-foreground mt-2">
                            {new Date(item.savedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t text-center">
          <p className="text-muted-foreground mb-4">
            Want to discover and curate content like {profile.displayName}?
          </p>
          <Button asChild>
            <a href="/">Join DropDaily</a>
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default PublicProfile;