'use client';

import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface TicketDigitalPassProps {
  eventName: string;
  eventDate: string;
  ticketTier: string;
  ticketId: string;
  userName: string;
  orderId: string;
  totalPaid: number;
  currency: string;
}

export default function TicketDigitalPass({
  eventName,
  eventDate,
  ticketTier,
  ticketId,
  userName,
  orderId,
  totalPaid,
  currency,
}: TicketDigitalPassProps) {
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrCodeRef.current) {
      QRCode.toCanvas(qrCodeRef.current, ticketId, {
        width: 200,
        margin: 2,
        color: {
          dark: '#d4af37',
          light: '#1a1a1a',
        },
      });
    }
  }, [ticketId]);

  const handleDownload = () => {
    const canvas = qrCodeRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${eventName}-ticket-${ticketId}.png`;
      link.click();
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #d4af37 0%, #9d7e1f 50%, #1a1a1a 100%)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        margin: '0 auto',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif",
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
          🎉 Your Premium Ticket
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Member's Club Pass</p>
      </div>

      {/* Event Info */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.25rem 0', opacity: 0.8, fontSize: '0.9rem' }}>EVENT</p>
          <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{eventName}</p>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.25rem 0', opacity: 0.8, fontSize: '0.9rem' }}>DATE</p>
          <p style={{ margin: 0, fontSize: '1.1rem' }}>{eventDate}</p>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.25rem 0', opacity: 0.8, fontSize: '0.9rem' }}>TIER</p>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#d4af37' }}>
            {ticketTier}
          </p>
        </div>
        <div>
          <p style={{ margin: '0 0 0.25rem 0', opacity: 0.8, fontSize: '0.9rem' }}>GUEST</p>
          <p style={{ margin: 0, fontSize: '1.1rem' }}>{userName}</p>
        </div>
      </div>

      {/* QR Code */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <canvas
          ref={qrCodeRef}
          style={{
            background: '#ffffff',
            padding: '1rem',
            borderRadius: '8px',
            display: 'inline-block',
          }}
        />
        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Scan at Entry</p>
      </div>

      {/* Order Details */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Order ID:</span>
          <span style={{ fontWeight: 'bold' }}>{orderId}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Ticket ID:</span>
          <span style={{ fontWeight: 'bold' }}>{ticketId}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
          <span>Total Paid:</span>
          <span style={{ fontWeight: 'bold', color: '#d4af37' }}>
            {currency} {totalPaid.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: '#ffffff',
          color: '#d4af37',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '1rem',
          transition: 'all 0.3s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        📥 Download Ticket
      </button>

      {/* Footer */}
      <p style={{ textAlign: 'center', margin: '1rem 0 0 0', opacity: 0.7, fontSize: '0.85rem' }}>
        ✨ Party Time Africa - Premium Event Platform
      </p>
    </div>
  );
}

