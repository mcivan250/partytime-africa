'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function TopHeader() {
  const [notificationCount, setNotificationCount] = useState(1);
  const [messageCount, setMessageCount] = useState(2);

  return (
    <div className="fixed top-0 left-0 right-0 bg-secondary border-b border-border/30 z-40 safe-area-inset-top">
      <div className="flex justify-between items-center px-4 py-3 max-w-2xl mx-auto w-full">
        {/* Left: Logo/Title */}
        <div className="text-accent font-display font-bold text-lg">
          🎉 PartyTime
        </div>

        {/* Right: Notification and Message Icons */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative text-text-light hover:text-accent transition-colors"
          >
            <span className="text-2xl">🔔</span>
            {notificationCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </Link>

          {/* Messages */}
          <Link
            href="/messages"
            className="relative text-text-light hover:text-accent transition-colors"
          >
            <span className="text-2xl">💬</span>
            {messageCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {messageCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
