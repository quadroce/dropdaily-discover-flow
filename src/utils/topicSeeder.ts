
import { supabase } from '@/integrations/supabase/client';

// This is the taxonomy data that will be seeded into the database
const topicTaxonomy = {
  "sports": [
    { slug: "football", name: "Football", description: "American football news, games, and analysis" },
    { slug: "basketball", name: "Basketball", description: "NBA, college basketball, and international leagues" },
    { slug: "baseball", name: "Baseball", description: "MLB, minor leagues, and baseball analytics" },
    { slug: "soccer", name: "Soccer", description: "International soccer, MLS, and major leagues" },
    { slug: "tennis", name: "Tennis", description: "Professional tennis tours and tournaments" },
    { slug: "golf", name: "Golf", description: "PGA, major championships, and golf instruction" },
    { slug: "hockey", name: "Hockey", description: "NHL, international hockey, and college hockey" },
    { slug: "motorsports", name: "Motorsports", description: "Formula 1, NASCAR, and other racing series" },
    { slug: "combat-sports", name: "Combat Sports", description: "Boxing, MMA, and martial arts" },
    { slug: "olympics", name: "Olympics", description: "Olympic games and Olympic sports" }
  ],
  "technology": [
    { slug: "artificial-intelligence", name: "Artificial Intelligence", description: "AI research, applications, and industry news" },
    { slug: "software-development", name: "Software Development", description: "Programming, frameworks, and development tools" },
    { slug: "cybersecurity", name: "Cybersecurity", description: "Information security, threats, and protection" },
    { slug: "blockchain", name: "Blockchain", description: "Cryptocurrency, DeFi, and blockchain technology" },
    { slug: "mobile-tech", name: "Mobile Technology", description: "Smartphones, apps, and mobile development" },
    { slug: "cloud-computing", name: "Cloud Computing", description: "Cloud services, infrastructure, and platforms" },
    { slug: "data-science", name: "Data Science", description: "Analytics, machine learning, and big data" },
    { slug: "gaming-tech", name: "Gaming Technology", description: "Video games, gaming hardware, and esports" },
    { slug: "hardware", name: "Hardware", description: "Computer components, gadgets, and electronics" },
    { slug: "startups", name: "Startups", description: "Tech startups, funding, and entrepreneurship" }
  ],
  "entertainment": [
    { slug: "movies", name: "Movies", description: "Film reviews, industry news, and cinema" },
    { slug: "tv-shows", name: "TV Shows", description: "Television series, streaming, and broadcast content" },
    { slug: "music", name: "Music", description: "Music industry, artists, and new releases" },
    { slug: "celebrities", name: "Celebrities", description: "Celebrity news, gossip, and entertainment" },
    { slug: "gaming", name: "Gaming", description: "Video games, reviews, and gaming culture" },
    { slug: "books", name: "Books", description: "Literature, publishing, and book reviews" },
    { slug: "streaming", name: "Streaming", description: "Streaming platforms and digital content" },
    { slug: "theater", name: "Theater", description: "Broadway, live performances, and theater news" },
    { slug: "comedy", name: "Comedy", description: "Stand-up comedy, comedy shows, and humor" },
    { slug: "podcasts", name: "Podcasts", description: "Podcast recommendations and audio content" }
  ],
  "business": [
    { slug: "finance", name: "Finance", description: "Financial markets, investing, and economic news" },
    { slug: "entrepreneurship", name: "Entrepreneurship", description: "Business startups, innovation, and leadership" },
    { slug: "real-estate", name: "Real Estate", description: "Property markets, investment, and housing" },
    { slug: "marketing", name: "Marketing", description: "Digital marketing, advertising, and brand strategy" },
    { slug: "economics", name: "Economics", description: "Economic policy, trends, and analysis" },
    { slug: "workplace", name: "Workplace", description: "Career advice, workplace culture, and employment" },
    { slug: "retail", name: "Retail", description: "Retail industry, consumer trends, and e-commerce" },
    { slug: "manufacturing", name: "Manufacturing", description: "Industrial production and manufacturing trends" },
    { slug: "energy", name: "Energy", description: "Energy sector, renewables, and sustainability" },
    { slug: "healthcare-business", name: "Healthcare Business", description: "Healthcare industry and medical business" }
  ],
  "politics": [
    { slug: "us-politics", name: "US Politics", description: "American political news and government" },
    { slug: "international-politics", name: "International Politics", description: "Global politics and international relations" },
    { slug: "elections", name: "Elections", description: "Political campaigns and election coverage" },
    { slug: "policy", name: "Policy", description: "Government policy and legislation" },
    { slug: "political-analysis", name: "Political Analysis", description: "Political commentary and analysis" },
    { slug: "local-politics", name: "Local Politics", description: "State and local government news" },
    { slug: "political-parties", name: "Political Parties", description: "Party politics and political movements" },
    { slug: "government", name: "Government", description: "Government operations and public administration" },
    { slug: "diplomacy", name: "Diplomacy", description: "International diplomacy and foreign policy" },
    { slug: "activism", name: "Activism", description: "Political activism and social movements" }
  ],
  "science": [
    { slug: "space", name: "Space", description: "Astronomy, space exploration, and cosmic discoveries" },
    { slug: "medicine", name: "Medicine", description: "Medical research, healthcare, and health news" },
    { slug: "environment", name: "Environment", description: "Climate change, conservation, and environmental science" },
    { slug: "physics", name: "Physics", description: "Physics research and scientific discoveries" },
    { slug: "biology", name: "Biology", description: "Biological sciences and life sciences research" },
    { slug: "chemistry", name: "Chemistry", description: "Chemical research and discoveries" },
    { slug: "psychology", name: "Psychology", description: "Psychology research and mental health" },
    { slug: "archaeology", name: "Archaeology", description: "Archaeological discoveries and ancient history" },
    { slug: "genetics", name: "Genetics", description: "Genetic research and biotechnology" },
    { slug: "neuroscience", name: "Neuroscience", description: "Brain research and neuroscience discoveries" }
  ],
  "lifestyle": [
    { slug: "health-fitness", name: "Health & Fitness", description: "Fitness, nutrition, and wellness" },
    { slug: "food", name: "Food", description: "Cooking, restaurants, and culinary trends" },
    { slug: "travel", name: "Travel", description: "Travel destinations, tips, and experiences" },
    { slug: "fashion", name: "Fashion", description: "Fashion trends, style, and design" },
    { slug: "home-garden", name: "Home & Garden", description: "Home improvement, gardening, and interior design" },
    { slug: "parenting", name: "Parenting", description: "Parenting advice, family life, and child development" },
    { slug: "relationships", name: "Relationships", description: "Dating, marriage, and relationship advice" },
    { slug: "personal-finance", name: "Personal Finance", description: "Personal money management and financial planning" },
    { slug: "self-improvement", name: "Self Improvement", description: "Personal development and life skills" },
    { slug: "hobbies", name: "Hobbies", description: "Recreational activities and personal interests" }
  ]
};

export const seedTopics = async () => {
  try {
    console.log('Starting to seed topics...');
    
    // Check if topics already exist
    const { data: existingTopics, error: checkError } = await supabase
      .from('topics')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing topics:', checkError);
      throw checkError;
    }

    if (existingTopics && existingTopics.length > 0) {
      console.log('Topics already exist, skipping seed');
      return { success: true, message: 'Topics already exist' };
    }

    // Prepare topics for insertion
    const topicsToInsert = [];
    
    for (const [category, topics] of Object.entries(topicTaxonomy)) {
      for (const topic of topics) {
        topicsToInsert.push({
          slug: topic.slug,
          name: topic.name,
          category: category,
          parent_category: null,
          description: topic.description
        });
      }
    }

    console.log(`Inserting ${topicsToInsert.length} topics...`);

    // Insert topics in batches to avoid hitting limits
    const batchSize = 50;
    for (let i = 0; i < topicsToInsert.length; i += batchSize) {
      const batch = topicsToInsert.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('topics')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting topics batch:', insertError);
        throw insertError;
      }
    }

    console.log('Topics seeded successfully!');
    return { success: true, message: 'Topics seeded successfully' };
    
  } catch (error) {
    console.error('Error seeding topics:', error);
    return { success: false, error: error.message };
  }
};
