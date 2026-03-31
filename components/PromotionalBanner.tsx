'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Promotion {
  id: string;
  type: 'discount' | 'giveaway' | 'trending' | 'advertisement';
  title: string;
  description: string;
  image?: string;
  link?: string;
  expiresAt?: string;
  badge?: string;
}

export default function PromotionalBanner() {
  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: '1',
      type: 'discount',
      title: '🎉 Early Bird Discount',
      description: 'Get 30% off all events this weekend!',
      badge: '30% OFF',
      link: '/events?filter=discount',
    },
    {
      id: '2',
      type: 'giveaway',
      title: '🎁 Win VIP Tickets',
      description: 'Tag 2 friends to enter our giveaway',
      badge: 'GIVEAWAY',
      link: '/giveaway',
    },
    {
      id: '3',
      type: 'trending',
      title: '🔥 Trending This Week',
      description: 'Afrobeats Night - 2.5k RSVPs',
      badge: 'TRENDING',
      link: '/events/trending',
    },
    {
      id: '4',
      type: 'advertisement',
      title: '📢 Partner with Us',
      description: 'Promote your brand to 50k+ party-goers',
      badge: 'ADVERTISE',
      link: '/advertise',
    },
  ]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoPlay, promotions.length]);

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'discount':
        return 'from-green-500/20 to-green-600/10';
      case 'giveaway':
        return 'from-purple-500/20 to-purple-600/10';
      case 'trending':
        return 'from-red-500/20 to-red-600/10';
      case 'advertisement':
        return 'from-blue-500/20 to-blue-600/10';
      default:
        return 'from-accent/20 to-accent/10';
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'discount':
        return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'giveaway':
        return 'bg-purple-500/20 border-purple-500/30 text-purple-400';
      case 'trending':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'advertisement':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      default:
        return 'bg-accent/20 border-accent/30 text-accent';
    }
  };

  const currentPromo = promotions[activeIndex];

  return (
    <div className="space-y-6">
      {/* Main Promotional Banner */}
      <Link href={currentPromo.link || '#'}>
        <div
          className={`bg-gradient-to-br ${getBackgroundColor(currentPromo.type)} border border-border/30 rounded-xl p-6 cursor-pointer hover:border-accent/50 transition-all group`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-text-light mb-2 group-hover:text-accent transition-colors">
                {currentPromo.title}
              </h3>
              <p className="text-text-dark mb-4">{currentPromo.description}</p>
              <button className="bg-accent text-primary px-6 py-2 rounded-lg font-semibold hover:bg-accent/90 transition-colors">
                Learn More →
              </button>
            </div>
            {currentPromo.badge && (
              <div className={`border rounded-lg px-4 py-2 font-bold text-sm whitespace-nowrap ml-4 ${getBadgeColor(currentPromo.type)}`}>
                {currentPromo.badge}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Carousel Indicators */}
      <div className="flex justify-center gap-2">
        {promotions.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setActiveIndex(index);
              setAutoPlay(false);
            }}
            className={`h-2 rounded-full transition-all ${
              index === activeIndex ? 'bg-accent w-8' : 'bg-border/30 w-2 hover:bg-border/50'
            }`}
          />
        ))}
      </div>

      {/* Promotional Cards Grid */}
      <div>
        <h3 className="text-lg font-bold text-text-light mb-4">Other Promotions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promotions
            .filter((_, index) => index !== activeIndex)
            .slice(0, 2)
            .map((promo) => (
              <Link key={promo.id} href={promo.link || '#'}>
                <div className={`bg-gradient-to-br ${getBackgroundColor(promo.type)} border border-border/30 rounded-lg p-4 cursor-pointer hover:border-accent/50 transition-all group`}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-text-light group-hover:text-accent transition-colors">
                      {promo.title}
                    </h4>
                    {promo.badge && (
                      <span className={`text-xs font-bold px-2 py-1 rounded border ${getBadgeColor(promo.type)}`}>
                        {promo.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-dark">{promo.description}</p>
                </div>
              </Link>
            ))}
        </div>
      </div>

      {/* Discount Tiers */}
      <div className="bg-secondary border border-border/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-text-light mb-4">Discount Tiers</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Early Bird', discount: '25%', color: 'from-green-500/20 to-green-600/10' },
            { label: 'Group (5+)', discount: '15%', color: 'from-blue-500/20 to-blue-600/10' },
            { label: 'Student', discount: '20%', color: 'from-purple-500/20 to-purple-600/10' },
            { label: 'Loyalty', discount: '30%', color: 'from-orange-500/20 to-orange-600/10' },
          ].map((tier, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${tier.color} border border-border/30 rounded-lg p-4 text-center`}
            >
              <p className="text-text-dark text-sm mb-2">{tier.label}</p>
              <p className="text-2xl font-bold text-accent">{tier.discount}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Events */}
      <div className="bg-secondary border border-border/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-text-light mb-4">🔥 Trending Events</h3>
        <div className="space-y-3">
          {[
            { name: 'Afrobeats Night', rsvps: '2.5k', trend: '↑ 45%' },
            { name: 'Tech Startup Mixer', rsvps: '1.8k', trend: '↑ 32%' },
            { name: 'Comedy Night', rsvps: '1.2k', trend: '↑ 28%' },
          ].map((event, index) => (
            <Link key={index} href={`/events?search=${event.name}`}>
              <div className="flex items-center justify-between p-3 bg-primary rounded-lg hover:border-accent/50 border border-border/30 transition-all cursor-pointer group">
                <div>
                  <p className="font-semibold text-text-light group-hover:text-accent transition-colors">{event.name}</p>
                  <p className="text-sm text-text-dark">{event.rsvps} going</p>
                </div>
                <span className="text-green-400 font-bold">{event.trend}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
