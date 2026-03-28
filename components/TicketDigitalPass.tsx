'use client';

import React, { useRef } from 'react';
import QRCode from 'qrcode.react';
import html2canvas from 'html2canvas';

interface TicketPassProps {
  ticket: {
    id: string;
    event_name: string;
    event_date: string;
    event_location: string;
    tier_name: string;
    purchase_price: number;
    currency: string;
    buyer_name: string;
    qr_code_data: string;
    order_id: string;
  };
  compact?: boolean;
}

export default function TicketDigitalPass({
  ticket,
  compact = false,
}: TicketPassProps) {
  const passRef = useRef<HTMLDivElement>(null);

  const downloadPass = async () => {
    if (passRef.current) {
      const canvas = await html2canvas(passRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `Ticket_${ticket.event_name.replace(/\s+/g, '_')}_${ticket.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const formattedDate = new Date(ticket.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(ticket.event_date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="ticket-pass-container p-4">
      <div 
        ref={passRef}
        className="ticket-pass bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm mx-auto border-2 border-purple-100"
      >
        {/* Header Section - Afrocentric Gradient */}
        <div className="pass-header p-6 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white relative">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">
              Official Event Pass
            </span>
            <span className="text-xs font-mono opacity-80">
              #{ticket.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <h2 className="text-2xl font-black mb-1 leading-tight">{ticket.event_name}</h2>
          <div className="flex items-center gap-2 text-sm font-medium opacity-90">
            <span>📍 {ticket.event_location}</span>
          </div>
          
          {/* Decorative Pattern Overlay */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <pattern id="afro-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M10 2 L10 18 M2 10 L18 10" stroke="currentColor" strokeWidth="1" />
              </pattern>
              <rect width="100" height="100" fill="url(#afro-pattern)" />
            </svg>
          </div>
        </div>

        {/* Info Section */}
        <div className="pass-info p-6 space-y-6 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Date</label>
              <span className="text-sm font-bold text-gray-800">{formattedDate}</span>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Time</label>
              <span className="text-sm font-bold text-gray-800">{formattedTime}</span>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Tier</label>
              <span className="text-sm font-bold text-purple-600">{ticket.tier_name}</span>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Buyer</label>
              <span className="text-sm font-bold text-gray-800">{ticket.buyer_name}</span>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="qr-section flex flex-col items-center py-4 border-t-2 border-dashed border-gray-100">
            <div className="bg-white p-3 rounded-xl shadow-inner border border-gray-100">
              <QRCode 
                value={ticket.qr_code_data} 
                size={160}
                level="H"
                includeMargin={false}
                renderAs="svg"
              />
            </div>
            <p className="mt-4 text-[10px] font-medium text-gray-400 text-center uppercase tracking-widest">
              Scan at entry for verification
            </p>
          </div>
        </div>

        {/* Footer - Receipt Info */}
        <div className="pass-footer p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <div className="text-left">
            <label className="text-[9px] uppercase font-bold text-gray-400 block">Total Paid</label>
            <span className="text-sm font-black text-gray-800">
              {ticket.currency} {ticket.purchase_price.toLocaleString()}
            </span>
          </div>
          <div className="text-right">
            <label className="text-[9px] uppercase font-bold text-gray-400 block">Order ID</label>
            <span className="text-[10px] font-mono text-gray-500">
              {ticket.order_id.slice(0, 13)}...
            </span>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="actions mt-8 flex flex-col gap-3 max-w-sm mx-auto">
          <button 
            onClick={downloadPass}
            className="w-full py-4 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 transition-all shadow-xl flex items-center justify-center gap-2"
          >
            📥 Download Ticket Pass
          </button>
          <div className="flex gap-2">
            <button className="flex-1 py-3 bg-white border-2 border-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm">
              🗓️ Add to Calendar
            </button>
            <button className="flex-1 py-3 bg-white border-2 border-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm">
              📧 Email Receipt
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .ticket-pass {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .pass-header {
          clip-path: polygon(0 0, 100% 0, 100% 90%, 0 100%);
        }
      `}</style>
    </div>
  );
}
