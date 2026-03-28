'use client';

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

interface InvitationCardProps {
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  momentImage?: string;
  userAvatar?: string;
  userName: string;
  eventSlug: string;
}

export const InvitationCardGenerator: React.FC<InvitationCardProps> = ({
  eventTitle,
  eventDate,
  eventLocation,
  momentImage,
  userAvatar,
  userName,
  eventSlug,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCard = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${eventSlug}-invitation.png`;
      link.click();

      // Also copy to clipboard for direct sharing
      canvas.toBlob((blob) => {
        if (blob) {
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
        }
      });
    } catch (error) {
      console.error('Error generating invitation card:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToWhatsApp = () => {
    const text = `🎉 You're invited to ${eventTitle}!\n📍 ${eventLocation}\n🕐 ${eventDate}\n\nJoin me at Party Time Africa!\nwww.partytime.africa/events/${eventSlug}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareToInstagram = () => {
    const text = `🎉 ${eventTitle}\n📍 ${eventLocation}\n🕐 ${eventDate}\n\nJoin me at @PartyTimeAfrica\nLink in bio!`;
    // Note: Instagram doesn't support direct sharing via URL, so we copy to clipboard
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard! Paste on Instagram Stories.');
  };

  return (
    <div className="invitation-card-container">
      {/* Card Preview */}
      <div
        ref={cardRef}
        className="invitation-card"
        style={{
          width: '1080px',
          height: '1080px',
          background: 'linear-gradient(135deg, #E91E63 0%, #FFD700 50%, #00BCD4 100%)',
          padding: '60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'center',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Top Section */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 900,
              margin: '0 0 20px 0',
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            🎉 YOU'RE INVITED 🎉
          </h1>
        </div>

        {/* Event Image */}
        {momentImage && (
          <div
            style={{
              width: '300px',
              height: '300px',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '8px solid white',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <img
              src={momentImage}
              alt="Event"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        )}

        {/* Event Details */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2
            style={{
              fontSize: '48px',
              fontWeight: 700,
              margin: '20px 0',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            {eventTitle}
          </h2>

          <div
            style={{
              fontSize: '28px',
              fontWeight: 600,
              margin: '16px 0',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            📍 {eventLocation}
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: 600,
              margin: '16px 0',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            🕐 {eventDate}
          </div>
        </div>

        {/* Shared By */}
        {userAvatar && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              position: 'relative',
              zIndex: 1,
              marginTop: '20px',
            }}
          >
            <img
              src={userAvatar}
              alt={userName}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '3px solid white',
              }}
            />
            <span
              style={{
                fontSize: '20px',
                fontWeight: 600,
              }}
            >
              Shared by {userName}
            </span>
          </div>
        )}

        {/* CTA */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: '20px',
            fontSize: '32px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '3px',
            textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          www.partytime.africa
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginTop: '32px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={generateCard}
          disabled={isGenerating}
          style={{
            background: 'linear-gradient(135deg, #FF6F00 0%, #E91E63 100%)',
            color: 'white',
            padding: '12px 32px',
            borderRadius: '50px',
            border: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            opacity: isGenerating ? 0.6 : 1,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {isGenerating ? 'Generating...' : '📥 Download Card'}
        </button>

        <button
          onClick={shareToWhatsApp}
          style={{
            background: '#25D366',
            color: 'white',
            padding: '12px 32px',
            borderRadius: '50px',
            border: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          💬 Share on WhatsApp
        </button>

        <button
          onClick={shareToInstagram}
          style={{
            background: 'linear-gradient(135deg, #FD1D1D 0%, #833AB4 50%, #FD1D1D 100%)',
            color: 'white',
            padding: '12px 32px',
            borderRadius: '50px',
            border: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          📸 Share on Instagram
        </button>
      </div>
    </div>
  );
};

export default InvitationCardGenerator;
