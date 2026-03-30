import React, { useState, useEffect } from 'react';

export interface Guest {
  id: string;
  name: string;
  avatar?: string;
  joinedAt: string;
  status: 'going' | 'interested' | 'cancelled';
  tier?: 'vip' | 'regular' | 'early-bird';
}

interface GuestListProps {
  eventId: string;
  guests: Guest[];
  maxDisplay?: number;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

export default function GuestList({
  eventId,
  guests,
  maxDisplay = 6,
  onLoadMore,
  isLoading = false,
}: GuestListProps) {
  const [displayedGuests, setDisplayedGuests] = useState<Guest[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (showAll) {
      setDisplayedGuests(guests);
    } else {
      setDisplayedGuests(guests.slice(0, maxDisplay));
    }
  }, [guests, showAll, maxDisplay]);

  const goingCount = guests.filter(g => g.status === 'going').length;
  const interestedCount = guests.filter(g => g.status === 'interested').length;
  const vipCount = guests.filter(g => g.tier === 'vip').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 bg-secondary border-border/50 text-center">
          <p className="text-2xl font-bold text-accent">{goingCount}</p>
          <p className="text-xs text-text-dark uppercase">Going</p>
        </div>
        <div className="card p-4 bg-secondary border-border/50 text-center">
          <p className="text-2xl font-bold text-yellow-500">{interestedCount}</p>
          <p className="text-xs text-text-dark uppercase">Interested</p>
        </div>
        <div className="card p-4 bg-secondary border-border/50 text-center">
          <p className="text-2xl font-bold text-purple-500">{vipCount}</p>
          <p className="text-xs text-text-dark uppercase">VIP</p>
        </div>
      </div>

      {/* Guest List */}
      <div className="space-y-3">
        <h3 className="text-lg font-display font-bold">Who's Going</h3>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mx-auto"></div>
          </div>
        ) : displayedGuests.length === 0 ? (
          <div className="text-center py-8 text-text-dark">
            <p className="text-sm">Be the first to RSVP!</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {displayedGuests.map(guest => (
                <div
                  key={guest.id}
                  className="card p-3 bg-secondary border-border/30 flex items-center justify-between hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent border border-accent/30">
                      {guest.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{guest.name}</p>
                      <p className="text-xs text-text-dark">
                        {new Date(guest.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {guest.tier === 'vip' && (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                        👑 VIP
                      </span>
                    )}
                    {guest.status === 'going' && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                        ✓ Going
                      </span>
                    )}
                    {guest.status === 'interested' && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                        ♡ Interested
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {guests.length > maxDisplay && (
              <button
                onClick={() => {
                  setShowAll(!showAll);
                  onLoadMore?.();
                }}
                className="w-full py-2 text-accent hover:text-yellow-300 font-semibold text-sm transition-colors"
              >
                {showAll ? 'Show Less' : `View All ${guests.length} Guests`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Share Section */}
      <div className="card p-4 bg-accent/10 border-accent/20">
        <p className="text-sm text-text-dark mb-3">Invite your friends!</p>
        <div className="flex gap-2">
          <button className="flex-1 py-2 bg-accent text-primary rounded-lg font-semibold text-sm hover:bg-yellow-500 transition-colors">
            Share
          </button>
          <button className="flex-1 py-2 bg-secondary border border-border/50 rounded-lg font-semibold text-sm hover:border-accent/50 transition-colors">
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}
