'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface CheckInRecord {
  ticketId: string;
  ticketNumber: string;
  userName: string;
  checkedInAt: string;
  status: 'success' | 'error';
  message: string;
}

export default function QRCodeCheckIn({ eventId }: { eventId: string }) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([]);
  const [stats, setStats] = useState({
    totalCheckedIn: 0,
    totalTickets: 0,
    checkInRate: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const startScanning = () => {
    if (!scannerRef.current) return;

    const html5QrcodeScanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    html5QrcodeScanner.render(onScanSuccess, onScanError);
    setScanner(html5QrcodeScanner);
    setIsScanning(true);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
      setIsScanning(false);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    try {
      const qrData = JSON.parse(decodedText);

      // Validate QR code
      if (!qrData.ticketId || !qrData.eventId) {
        addCheckInRecord({
          ticketId: '',
          ticketNumber: 'UNKNOWN',
          userName: 'Unknown',
          checkedInAt: new Date().toLocaleString(),
          status: 'error',
          message: 'Invalid QR code format',
        });
        return;
      }

      // Check if ticket belongs to this event
      if (qrData.eventId !== eventId) {
        addCheckInRecord({
          ticketId: qrData.ticketId,
          ticketNumber: qrData.ticketNumber || 'UNKNOWN',
          userName: 'Unknown',
          checkedInAt: new Date().toLocaleString(),
          status: 'error',
          message: 'Ticket is for a different event',
        });
        return;
      }

      // Get ticket details
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*, users:user_id(raw_user_meta_data)')
        .eq('id', qrData.ticketId)
        .single();

      if (ticketError || !ticket) {
        addCheckInRecord({
          ticketId: qrData.ticketId,
          ticketNumber: qrData.ticketNumber || 'UNKNOWN',
          userName: 'Unknown',
          checkedInAt: new Date().toLocaleString(),
          status: 'error',
          message: 'Ticket not found',
        });
        return;
      }

      // Check if already checked in
      if (ticket.checked_in_at) {
        addCheckInRecord({
          ticketId: ticket.id,
          ticketNumber: ticket.ticket_number,
          userName: ticket.users?.raw_user_meta_data?.name || 'Unknown',
          checkedInAt: new Date().toLocaleString(),
          status: 'error',
          message: `Already checked in at ${new Date(ticket.checked_in_at).toLocaleTimeString()}`,
        });
        return;
      }

      // Check if ticket is valid
      if (ticket.status !== 'valid') {
        addCheckInRecord({
          ticketId: ticket.id,
          ticketNumber: ticket.ticket_number,
          userName: ticket.users?.raw_user_meta_data?.name || 'Unknown',
          checkedInAt: new Date().toLocaleString(),
          status: 'error',
          message: `Ticket status: ${ticket.status}`,
        });
        return;
      }

      // Perform check-in
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          checked_in_at: new Date().toISOString(),
          status: 'used',
        })
        .eq('id', ticket.id);

      if (updateError) throw updateError;

      addCheckInRecord({
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        userName: ticket.users?.raw_user_meta_data?.name || 'Unknown',
        checkedInAt: new Date().toLocaleString(),
        status: 'success',
        message: 'Successfully checked in',
      });

      // Update stats
      updateStats();
    } catch (error: any) {
      console.error('Check-in error:', error);
      addCheckInRecord({
        ticketId: '',
        ticketNumber: 'ERROR',
        userName: 'Unknown',
        checkedInAt: new Date().toLocaleString(),
        status: 'error',
        message: error.message || 'An error occurred during check-in',
      });
    }
  };

  const onScanError = (error: any) => {
    // Ignore scanning errors
    console.debug('QR scan error:', error);
  };

  const addCheckInRecord = (record: CheckInRecord) => {
    setCheckInRecords((prev) => [record, ...prev.slice(0, 49)]);
  };

  const updateStats = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, status')
        .eq('event_id', eventId);

      if (error) throw error;

      const totalTickets = data?.length || 0;
      const totalCheckedIn = data?.filter((t) => t.status === 'used').length || 0;

      setStats({
        totalCheckedIn,
        totalTickets,
        checkInRate: totalTickets > 0 ? Math.round((totalCheckedIn / totalTickets) * 100) : 0,
      });
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  const exportCheckInData = () => {
    const csv = [
      ['Ticket Number', 'Guest Name', 'Checked In At', 'Status'],
      ...checkInRecords.map((r) => [r.ticketNumber, r.userName, r.checkedInAt, r.status]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `check-in-${eventId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Scanner Controls */}
      <div className="flex gap-3">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="flex-1 bg-accent text-primary py-3 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
          >
            🔍 Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 py-3 rounded-lg font-semibold hover:bg-red-500/20 transition-colors"
          >
            ⏹️ Stop Scanning
          </button>
        )}
        <button
          onClick={exportCheckInData}
          className="flex-1 bg-primary border border-border/30 text-text-light py-3 rounded-lg font-semibold hover:border-accent/50 transition-colors"
        >
          📥 Export Data
        </button>
      </div>

      {/* QR Scanner */}
      {isScanning && (
        <div className="bg-primary rounded-lg p-4 border border-border/30">
          <div id="qr-reader" className="w-full"></div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-primary rounded-lg p-4 border border-border/30 text-center">
          <p className="text-text-dark text-sm">Total Checked In</p>
          <p className="text-3xl font-bold text-accent">{stats.totalCheckedIn}</p>
        </div>
        <div className="bg-primary rounded-lg p-4 border border-border/30 text-center">
          <p className="text-text-dark text-sm">Total Tickets</p>
          <p className="text-3xl font-bold text-text-light">{stats.totalTickets}</p>
        </div>
        <div className="bg-primary rounded-lg p-4 border border-border/30 text-center">
          <p className="text-text-dark text-sm">Check-In Rate</p>
          <p className="text-3xl font-bold text-green-400">{stats.checkInRate}%</p>
        </div>
      </div>

      {/* Check-In Records */}
      {checkInRecords.length > 0 && (
        <div className="bg-primary rounded-lg p-4 border border-border/30 space-y-3">
          <h3 className="text-lg font-bold text-text-light">Recent Check-Ins</h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {checkInRecords.map((record, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  record.status === 'success'
                    ? 'bg-green-500/5 border-green-500/30'
                    : 'bg-red-500/5 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold ${record.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {record.ticketNumber}
                    </p>
                    <p className="text-sm text-text-dark">{record.userName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-dark">{record.checkedInAt}</p>
                    <p className="text-xs text-text-dark">{record.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isScanning && checkInRecords.length === 0 && (
        <div className="text-center py-8 text-text-dark">
          <p className="text-4xl mb-2">📱</p>
          <p>Click "Start Scanning" to begin checking in guests</p>
        </div>
      )}
    </div>
  );
}
