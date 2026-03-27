'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBuyerTickets, Ticket } from '@/lib/tickets';
import { getCurrentUser } from '@/lib/auth';

export default function TicketWallet() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const userTickets = await getBuyerTickets(user.id);
      setTickets(userTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🎫</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Tickets Yet</h3>
        <p className="text-gray-600 mb-6">Browse events and buy tickets to get started!</p>
        <Link
          href="/events"
          className="inline-block bg-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-700 transition"
        >
          Browse Events
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-l-4 border-purple-600"
          onClick={() => setSelectedTicket(ticket)}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900">{ticket.ticket_number}</h3>
              <p className="text-sm text-gray-600">
                {new Date(ticket.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">${ticket.price_paid}</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  ticket.checked_in
                    ? 'bg-green-100 text-green-800'
                    : ticket.status === 'active'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {ticket.checked_in ? '✓ Used' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
              </span>
            </div>
          </div>

          {/* QR Code Preview */}
          {ticket.qr_code_data && (
            <div className="mb-4 flex justify-center">
              <img
                src={ticket.qr_code_data}
                alt="QR Code"
                className="w-24 h-24 border border-gray-300 rounded"
              />
            </div>
          )}

          <p className="text-xs text-gray-500">
            {ticket.checked_in && ticket.checked_in_at
              ? `Checked in: ${new Date(ticket.checked_in_at).toLocaleString()}`
              : 'Not yet checked in'}
          </p>
        </div>
      ))}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Your Ticket</h2>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Ticket Number</p>
                <p className="font-bold text-gray-900">{selectedTicket.ticket_number}</p>
              </div>

              {selectedTicket.qr_code_data && (
                <div className="flex justify-center">
                  <img
                    src={selectedTicket.qr_code_data}
                    alt="QR Code"
                    className="w-48 h-48 border-2 border-gray-300 rounded"
                  />
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Price Paid</p>
                <p className="font-bold text-gray-900">${selectedTicket.price_paid}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-bold text-gray-900">
                  {selectedTicket.checked_in ? '✓ Used' : 'Active'}
                </p>
              </div>

              {selectedTicket.checked_in && selectedTicket.checked_in_at && (
                <div>
                  <p className="text-sm text-gray-600">Checked In</p>
                  <p className="font-bold text-gray-900">
                    {new Date(selectedTicket.checked_in_at).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Show this QR code at the event entrance
                </p>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
