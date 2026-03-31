import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  poster_url?: string;
  theme?: string;
  host_id: string;
  created_at: string;
}

interface VibePost {
  event: Event;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

export default function TheVibeFeed() {
  const [posts, setPosts] = useState<VibePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<'all' | 'trending' | 'upcoming' | 'near-me'>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let query = supabase.from('events').select('*');

      if (filter === 'trending') {
        query = query.order('created_at', { ascending: false }).limit(10);
      } else if (filter === 'upcoming') {
        query = query.gte('date', new Date().toISOString()).order('date', { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform data to include engagement metrics
      const vibeData: VibePost[] = (data || []).map((event) => ({
        event,
        likes: Math.floor(Math.random() * 500) + 50,
        comments: Math.floor(Math.random() * 100) + 10,
        shares: Math.floor(Math.random() * 50) + 5,
        isLiked: false,
        isBookmarked: false,
      }));

      setPosts(vibeData);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (index: number) => {
    setPosts((prev) => {
      const updated = [...prev];
      updated[index].isLiked = !updated[index].isLiked;
      updated[index].likes += updated[index].isLiked ? 1 : -1;
      return updated;
    });
  };

  const handleBookmark = (index: number) => {
    setPosts((prev) => {
      const updated = [...prev];
      updated[index].isBookmarked = !updated[index].isBookmarked;
      return updated;
    });
  };

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollPosition = scrollContainerRef.current.scrollLeft;
      const cardWidth = scrollContainerRef.current.offsetWidth;
      const newIndex = Math.round(scrollPosition / cardWidth);
      setCurrentIndex(newIndex);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mb-4"></div>
          <p className="text-text-light text-lg">Loading The Vibe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-secondary border-b border-border backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-display font-bold text-accent mb-4">🔥 The Vibe</h1>
          
          {/* Filter Tabs */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {(['all', 'trending', 'upcoming', 'near-me'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold transition-all ${
                  filter === tab
                    ? 'bg-accent text-primary'
                    : 'bg-border text-text-light hover:bg-border/80'
                }`}
              >
                {tab === 'all' && '✨ All Vibes'}
                {tab === 'trending' && '🔥 Trending'}
                {tab === 'upcoming' && '📅 Upcoming'}
                {tab === 'near-me' && '📍 Near Me'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vertical Scroll Feed */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-[calc(100vh-140px)] overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex gap-4 p-4 h-full">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <div
                key={post.event.id}
                className="flex-shrink-0 w-full md:w-96 snap-center"
              >
                <Link href={`/events/${post.event.id}`}>
                  <a className="block h-full">
                    <div className="relative h-full rounded-2xl overflow-hidden group cursor-pointer">
                      {/* Background Image */}
                      <Image
                        src={post.event.poster_url || `/images/event-placeholder-${(index % 3) + 1}.jpg`}
                        alt={post.event.name}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-500 group-hover:scale-110"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                      {/* Content */}
                      <div className="absolute inset-0 flex flex-col justify-between p-6">
                        {/* Top Section - Date Badge */}
                        <div className="flex justify-between items-start">
                          <div className="bg-accent/90 backdrop-blur-sm px-4 py-2 rounded-full">
                            <p className="text-primary font-bold text-sm">
                              {new Date(post.event.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleBookmark(index);
                            }}
                            className="bg-black/50 hover:bg-black/70 backdrop-blur-sm p-2 rounded-full transition-all"
                          >
                            <span className="text-2xl">{post.isBookmarked ? '❤️' : '🤍'}</span>
                          </button>
                        </div>

                        {/* Bottom Section - Event Details & Engagement */}
                        <div className="space-y-4">
                          {/* Event Info */}
                          <div>
                            <h2 className="text-3xl font-display font-bold text-text-light mb-2 line-clamp-2">
                              {post.event.name}
                            </h2>
                            <div className="flex items-center gap-2 text-text-dark mb-2">
                              <span>📍</span>
                              <p className="text-sm">{post.event.location}</p>
                            </div>
                            <p className="text-text-dark text-sm line-clamp-2">{post.event.description}</p>
                          </div>

                          {/* Engagement Metrics */}
                          <div className="flex gap-6 pt-4 border-t border-white/20">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleLike(index);
                              }}
                              className="flex items-center gap-2 text-text-light hover:text-accent transition-colors group/btn"
                            >
                              <span className="text-2xl group-hover/btn:scale-125 transition-transform">
                                {post.isLiked ? '❤️' : '🤍'}
                              </span>
                              <span className="text-sm font-semibold">{post.likes}</span>
                            </button>
                            <button className="flex items-center gap-2 text-text-light hover:text-accent transition-colors group/btn">
                              <span className="text-2xl group-hover/btn:scale-125 transition-transform">💬</span>
                              <span className="text-sm font-semibold">{post.comments}</span>
                            </button>
                            <button className="flex items-center gap-2 text-text-light hover:text-accent transition-colors group/btn">
                              <span className="text-2xl group-hover/btn:scale-125 transition-transform">📤</span>
                              <span className="text-sm font-semibold">{post.shares}</span>
                            </button>
                          </div>

                          {/* CTA Button */}
                          <button className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                            View Event & Book
                          </button>
                        </div>
                      </div>

                      {/* Vibe Indicator */}
                      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                        <p className="text-accent text-xs font-bold uppercase tracking-wider">
                          {post.likes > 300 ? '🔥 Hot' : post.likes > 100 ? '⚡ Trending' : '✨ New'}
                        </p>
                      </div>
                    </div>
                  </a>
                </Link>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-center text-text-dark">
                <p className="text-2xl mb-2">No vibes found</p>
                <p>Check back soon for more events!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Dots */}
      {posts.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-30">
          {posts.slice(0, 5).map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex % posts.length ? 'w-8 bg-accent' : 'w-2 bg-text-dark'
              }`}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
}
