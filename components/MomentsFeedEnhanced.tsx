'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { generateAffiliateLink } from '@/lib/affiliate-moments';
import Image from 'next/image';

interface Moment {
  id: string;
  event_id: string;
  user_id: string;
  image_url: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_profile?: {
    display_name: string;
    avatar_url: string;
  };
  liked_by_user?: boolean;
}

interface MomentsFeedEnhancedProps {
  eventId?: string;
  limit?: number;
}

export default function MomentsFeedEnhanced({
  eventId,
  limit = 20,
}: MomentsFeedEnhancedProps) {
  const { user } = useAuth();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareMenu, setShareMenu] = useState<string | null>(null);
  const [affiliateLink, setAffiliateLink] = useState<string | null>(null);

  useEffect(() => {
    loadMoments();
  }, [eventId]);

  const loadMoments = async () => {
    setLoading(true);
    let query = supabase
      .from('event_moments')
      .select(
        `
        id,
        event_id,
        user_id,
        image_url,
        caption,
        created_at,
        moment_likes(count),
        moment_comments(count)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading moments:', error);
      setLoading(false);
      return;
    }

    // Enrich with user profiles and like status
    const enrichedMoments = await Promise.all(
      (data || []).map(async (moment: any) => {
        const { data: profile } = await supabase
          .from('users')
          .select('display_name, avatar_url')
          .eq('id', moment.user_id)
          .single();

        let likedByUser = false;
        if (user) {
          const { data: like } = await supabase
            .from('moment_likes')
            .select('id')
            .eq('moment_id', moment.id)
            .eq('user_id', user.id)
            .single();
          likedByUser = !!like;
        }

        return {
          ...moment,
          likes_count: moment.moment_likes?.[0]?.count || 0,
          comments_count: moment.moment_comments?.[0]?.count || 0,
          user_profile: profile,
          liked_by_user: likedByUser,
        };
      })
    );

    setMoments(enrichedMoments);
    setLoading(false);
  };

  const handleLike = async (momentId: string) => {
    if (!user) {
      alert('Please sign in to like moments');
      return;
    }

    const moment = moments.find((m) => m.id === momentId);
    if (!moment) return;

    if (moment.liked_by_user) {
      // Unlike
      await supabase
        .from('moment_likes')
        .delete()
        .eq('moment_id', momentId)
        .eq('user_id', user.id);
    } else {
      // Like
      await supabase.from('moment_likes').insert([
        {
          moment_id: momentId,
          user_id: user.id,
        },
      ]);
    }

    await loadMoments();
  };

  const handleShare = (momentId: string) => {
    const link = generateAffiliateLink(momentId, user?.id || '');
    setAffiliateLink(link);
    setShareMenu(momentId);
  };

  const shareToWhatsApp = (momentId: string) => {
    const link = generateAffiliateLink(momentId, user?.id || '');
    const text = encodeURIComponent(
      `Check out this moment from the party! 🎉\n\n${link}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToInstagram = (momentId: string) => {
    const link = generateAffiliateLink(momentId, user?.id || '');
    const text = encodeURIComponent(`Check out this moment! 🎉 ${link}`);
    // Instagram doesn't have direct sharing API, so we copy to clipboard
    navigator.clipboard.writeText(link);
    alert('Link copied! Share it on your Instagram story.');
  };

  const copyAffiliateLink = () => {
    if (affiliateLink) {
      navigator.clipboard.writeText(affiliateLink);
      alert('Link copied to clipboard!');
      setShareMenu(null);
    }
  };

  if (loading) {
    return <div className="moments-feed-loading">Loading moments...</div>;
  }

  if (moments.length === 0) {
    return (
      <div className="moments-feed-empty">
        <p>No moments yet. Be the first to share!</p>
      </div>
    );
  }

  return (
    <div className="moments-feed-enhanced">
      {moments.map((moment) => (
        <div key={moment.id} className="moment-card">
          {/* Moment Image */}
          <div className="moment-image-container">
            <Image
              src={moment.image_url}
              alt={moment.caption}
              width={400}
              height={400}
              className="moment-image"
            />
            <div className="moment-overlay">
              <span className="affiliate-badge">💰 Earn Points</span>
            </div>
          </div>

          {/* Moment Header */}
          <div className="moment-header">
            {moment.user_profile?.avatar_url && (
              <img
                src={moment.user_profile.avatar_url}
                alt={moment.user_profile.display_name}
                className="user-avatar"
              />
            )}
            <div className="user-info">
              <span className="user-name">
                {moment.user_profile?.display_name || 'Anonymous'}
              </span>
              <span className="timestamp">
                {new Date(moment.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Moment Caption */}
          {moment.caption && <p className="moment-caption">{moment.caption}</p>}

          {/* Engagement Stats */}
          <div className="moment-stats">
            <span className="stat">❤️ {moment.likes_count} Likes</span>
            <span className="stat">💬 {moment.comments_count} Comments</span>
          </div>

          {/* Action Buttons */}
          <div className="moment-actions">
            <button
              className={`action-btn like-btn ${moment.liked_by_user ? 'liked' : ''}`}
              onClick={() => handleLike(moment.id)}
            >
              {moment.liked_by_user ? '❤️' : '🤍'} Like
            </button>

            <button
              className="action-btn comment-btn"
              onClick={() => {
                // TODO: Open comment modal
              }}
            >
              💬 Comment
            </button>

            <div className="share-menu-container">
              <button
                className="action-btn share-btn"
                onClick={() => handleShare(moment.id)}
              >
                📤 Share for Points
              </button>

              {shareMenu === moment.id && (
                <div className="share-menu">
                  <button onClick={() => shareToWhatsApp(moment.id)}>
                    📱 WhatsApp
                  </button>
                  <button onClick={() => shareToInstagram(moment.id)}>
                    📸 Instagram
                  </button>
                  <button onClick={copyAffiliateLink}>
                    🔗 Copy Link
                  </button>
                  <button
                    className="close-btn"
                    onClick={() => setShareMenu(null)}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Affiliate Info */}
          <div className="affiliate-info">
            <p className="info-text">
              💡 Share this moment and earn Party Points when friends buy tickets!
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
