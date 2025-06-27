
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Smartphone, Brain, Zap, Star, Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import YouTubeEmbed from "@/components/YouTubeEmbed";

const Index = () => {
  const [email, setEmail] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleWaitlistSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to join the waitlist.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already on the waitlist! 👋",
            description: "This email is already registered. We'll keep you updated!",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Welcome to DropDaily! 🎉",
          description: "You're on the waitlist. We'll notify you when we launch!",
        });
      }
      
      setEmail("");
    } catch (error) {
      console.error('Waitlist signup error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-inter">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="text-xl font-semibold">DropDaily</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How it works</a>
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Join Waitlist
              </Button>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in">
              <div className="flex flex-col space-y-4">
                <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How it works</a>
                <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
                <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
                <Button 
                  className="bg-blue-500 hover:bg-blue-600 text-white w-full"
                  onClick={() => {
                    setIsMenuOpen(false);
                    document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Join Waitlist
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-6 mb-12 lg:mb-0">
              <Badge className="bg-green-100 text-green-800 mb-6 animate-fade-in">
                🚀 Launching Soon - Join the Waitlist
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-in">
                Stop searching.<br />
                <span className="text-blue-500">Start discovering.</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed animate-fade-in">
                DropDaily is an AI-powered content discovery service that delivers curated articles, videos, and social media gems directly to you. Perfect for curious minds who don't have time to scroll.
              </p>
              
              {/* Waitlist Form */}
              <form onSubmit={handleWaitlistSignup} className="flex flex-col sm:flex-row gap-4 max-w-md animate-fade-in" id="waitlist-form">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  required
                  disabled={isSubmitting}
                />
                <Button 
                  type="submit" 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Joining..." : "Join Waitlist"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
              
              <p className="text-sm text-gray-500 mt-4">
                🔒 No spam. Unsubscribe anytime. Early access guaranteed.
              </p>
            </div>
            
            <div className="lg:col-span-6">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=400&fit=crop&crop=face"
                  alt="Person discovering content on laptop"
                  className="rounded-2xl shadow-2xl w-full animate-fade-in"
                />
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg animate-scale-in">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Daily content delivered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How DropDaily Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get personalized content in three simple steps. No searching, no scrolling through endless feeds.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-500">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Choose Your Interests</h3>
              <p className="text-gray-600">
                Tell us what topics fascinate you - from tech and science to lifestyle and creativity.
              </p>
            </Card>

            <Card className="p-8 text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-500">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Select Content Formats</h3>
              <p className="text-gray-600">
                Pick your preferred content types: articles, videos, social threads, or Reddit discussions.
              </p>
            </Card>

            <Card className="p-8 text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-500">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Receive Daily Drops</h3>
              <p className="text-gray-600">
                Get your personalized content delivered daily. Via app, email, or even WhatsApp.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Gallery */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Curated Content at Your Fingertips</h2>
            <p className="text-xl text-gray-600">
              See how DropDaily presents content in beautiful, digestible cards
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { type: "Article", title: "The Future of AI in Creative Industries", source: "TechCrunch", time: "5 min read" },
              { 
                type: "Video", 
                title: "Dan Pat Rugby Training", 
                source: "YouTube", 
                time: "12 min",
                isVideo: true,
                videoId: "UYKV0LXfj8k"
              },
              { type: "Thread", title: "10 productivity hacks that actually work", source: "Twitter", time: "2 min read" },
              { type: "Discussion", title: "What's the best investment advice you received?", source: "Reddit", time: "8 min read" },
              { type: "Article", title: "Minimalist Design Principles for 2024", source: "Design Milk", time: "7 min read" },
              { type: "Video", title: "Quick Mediterranean Recipes", source: "Instagram", time: "3 min" }
            ].map((item, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <Badge className="mb-3 bg-blue-100 text-blue-800">{item.type}</Badge>
                <h3 className="font-semibold mb-2 line-clamp-2">{item.title}</h3>
                {item.isVideo && item.videoId ? (
                  <div className="my-4">
                    <YouTubeEmbed 
                      videoId={item.videoId} 
                      title={item.title}
                    />
                  </div>
                ) : null}
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{item.source}</span>
                  <span>{item.time}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose DropDaily?</h2>
            <p className="text-xl text-gray-600">
              Powered by AI, designed for humans
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Brain className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">AI-Powered Curation</h3>
              <p className="text-gray-600">
                Our intelligent algorithms learn your preferences and deliver increasingly relevant content.
              </p>
            </div>

            <div className="text-center">
              <Smartphone className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Mobile-First Experience</h3>
              <p className="text-gray-600">
                Beautiful Flutter app designed for on-the-go discovery. Available on iOS and Android.
              </p>
            </div>

            <div className="text-center">
              <Zap className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Multiple Delivery Options</h3>
              <p className="text-gray-600">
                Get your content via the app, email newsletters, or even WhatsApp messages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you're ready
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 border-2 border-gray-200">
              <h3 className="text-2xl font-bold mb-4">Free</h3>
              <div className="text-4xl font-bold mb-6">€0<span className="text-lg font-normal text-gray-600">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />5 daily content pieces</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />Email delivery</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />Basic categories</li>
              </ul>
              <Button className="w-full" variant="outline">Start Free</Button>
            </Card>

            <Card className="p-8 border-2 border-blue-500 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">Most Popular</Badge>
              <h3 className="text-2xl font-bold mb-4">Pro</h3>
              <div className="text-4xl font-bold mb-6">€5<span className="text-lg font-normal text-gray-600">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />Unlimited content</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />All delivery methods</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />Advanced personalization</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />Priority support</li>
              </ul>
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">Choose Pro</Button>
            </Card>

            <Card className="p-8 border-2 border-green-500">
              <h3 className="text-2xl font-bold mb-4">Lifetime</h3>
              <div className="text-4xl font-bold mb-6">€99<span className="text-lg font-normal text-gray-600 line-through">€300</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />Everything in Pro</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />Early backer discount</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />Lifetime updates</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />VIP community access</li>
              </ul>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white">Get Lifetime</Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Early Users Say</h2>
            <p className="text-xl text-gray-600">
              Join thousands who've transformed their content discovery
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Product Manager",
                content: "DropDaily saves me hours every week. The AI really understands what I find interesting and valuable.",
                avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=100&h=100&fit=crop&crop=face"
              },
              {
                name: "Marcus Johnson",
                role: "Entrepreneur",
                content: "Finally, a way to stay informed without doom-scrolling. The WhatsApp delivery is genius!",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
              },
              {
                name: "Elena Rodriguez",
                role: "Designer",
                content: "The content quality is exceptional. It's like having a personal curator who knows exactly what inspires me.",
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-6 border-0 shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about DropDaily
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "How does the AI curation work?",
                answer: "Our AI analyzes your interests, reading patterns, and engagement to continuously improve content recommendations. The more you use DropDaily, the better it gets at finding content you'll love."
              },
              {
                question: "Can I choose my content sources?",
                answer: "Absolutely! You can specify preferred sources, exclude certain sites, and fine-tune your content preferences in your profile settings."
              },
              {
                question: "Is my data private and secure?",
                answer: "Yes, we take privacy seriously. Your data is encrypted, never sold to third parties, and you maintain full control over your information. You can export or delete your data anytime."
              },
              {
                question: "How often will I receive content?",
                answer: "By default, you'll receive a daily digest, but you can customize the frequency. Premium users can choose multiple deliveries per day or weekly summaries."
              },
              {
                question: "Can I try it before committing to a paid plan?",
                answer: "Yes! Our free plan gives you 5 daily content pieces so you can experience DropDaily risk-free. Upgrade anytime when you're ready for unlimited content."
              }
            ].map((faq, index) => (
              <Card key={index} className="p-6">
                <h3 className="font-semibold text-lg mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-green-400 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Content Discovery?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of curious minds who've already signed up for early access
          </p>
          
          <form onSubmit={handleWaitlistSignup} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white text-gray-900"
              required
              disabled={isSubmitting}
            />
            <Button 
              type="submit" 
              className="bg-white text-blue-500 hover:bg-gray-100 px-8"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Joining..." : "Get Early Access"}
            </Button>
          </form>
          
          <p className="text-sm mt-4 opacity-75">
            🎉 Limited time: Early backers get lifetime access for just €99
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <span className="text-xl font-semibold">DropDaily</span>
              </div>
              <p className="text-gray-400 mb-4">
                AI-powered content discovery for curious minds. Stop searching, start discovering.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2024 DropDaily. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
