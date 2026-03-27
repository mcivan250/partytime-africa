'use client';

import { useState, useRef, useEffect } from 'react';
import { checkInTicket, validateTicketQRCode, getEventCheckInAnalytics } from '@/lib/tickets';
import { getCurrentUser } from '@/lib/auth';

interface ScanResult {
  success: boolean;
  message: string;
  ticketNumber?: string;
}

export default function TicketScanner({ eventId }: { eventId: string }) {
  const [manualInput, setManualInput] = useState('');
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAnalytics();
    // Focus input for immediate scanning
    inputRef.current?.focus();
  }, [eventId]);

  const loadAnalytics = async () => {
    try {
      const data = await getEventCheckInAnalytics(eventId);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleScan = async (ticketNumber: string) => {
    if (!ticketNumber.trim()) return;

    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      // Validate ticket
      const validation = await validateTicketQRCode(ticketNumber, eventId);

      if (!validation.valid) {
        setScanResults((prev) => [
          {
            success: false,
            message: validation.message,
            ticketNumber,
          },
          ...prev,
        ]);
        return;
      }

      // Check in ticket
      if (validation.ticket) {
        await checkInTicket(validation.ticket.id, user.id);

        setScanResults((prev) => [
          {
            success: true,
            message: `✓ Ticket checked in successfully!`,
            ticketNumber,
          },
          ...prev,
        ]);

        // Reload analytics
        await loadAnalytics();
      }
    } catch (error) {
      console.error('Error processing scan:', error);
      setScanResults((prev) => [
        {
          success: false,
          message: 'Error processing ticket',
          ticketNumber,
        },
        ...prev,
      ]);
    } finally {
      setLoading(false);
      setManualInput('');
      inputRef.current?.focus();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(manualInput);
  };

  return (
    <div className="space-y-6">
      {/* Scanner Input */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🔍 Scan Tickets</h2>

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scan QR Code or Enter Ticket Number
            </label>
            <input
              ref={inputRef}
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="PT-XXXXXXXX-XXXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !manualInput.trim()}
            className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Check In'}
          </button>
        </form>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{analytics.totalTickets}</p>
            <p className="text-sm text-gray-600">Total Tickets</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{analytics.checkedIn}</p>
            <p className="text-sm text-gray-600">Checked In</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{analytics.noShow}</p>
            <p className="text-sm text-gray-600">No Show</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {analytics.checkInRate.toFixed(0)}%
            </p>
            <p className="text-sm text-gray-600">Check-in Rate</p>
          </div>
        </div>
      )}

      {/* Scan Results */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-gray-900">Recent Scans</h3>

        {scanResults.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No scans yet. Start scanning tickets!</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scanResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{result.ticketNumber}</p>
                    <p
                      className={`text-sm ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {result.message}
                    </p>
                  </div>
                  <span className="text-2xl">{result.success ? '✓' : '✗'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
