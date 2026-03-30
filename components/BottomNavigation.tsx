'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function BottomNavigation() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    // Determine active tab based on current route
    const path = router.pathname;
    if (path === '/') setActiveTab('home');
    else if (path.startsWith('/events')) setActiveTab('events');
    else if (path === '/vibe-map') setActiveTab('explore');
    else if (path === '/profile') setActiveTab('profile');
  }, [router.pathname]);

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠', href: '/' },
    { id: 'events', label: 'Events', icon: '📅', href: '/events' },
    { id: 'create', label: 'Create', icon: '➕', href: '/events/create-with-tiers' },
    { id: 'explore', label: 'Explore', icon: '🗺️', href: '/vibe-map' },
    { id: 'profile', label: 'Profile', icon: '👤', href: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-secondary border-t border-border/30 z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-20 max-w-2xl mx-auto">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              activeTab === item.id
                ? 'text-accent'
                : 'text-text-dark hover:text-text-light'
            }`}
          >
            <span className="text-2xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
