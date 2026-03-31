'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Table {
  id: string;
  number: number;
  capacity: number;
  x: number;
  y: number;
  booked: boolean;
  bookedBy?: string;
  bookingTime?: string;
}

interface VenueLayout {
  eventId: string;
  tables: Table[];
  width: number;
  height: number;
}

export default function VenueLayoutManager({ eventId }: { eventId: string }) {
  const [layout, setLayout] = useState<VenueLayout>({
    eventId,
    tables: [],
    width: 800,
    height: 600,
  });

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [loading, setLoading] = useState(false);

  const addTable = () => {
    const newTable: Table = {
      id: `table_${Date.now()}`,
      number: layout.tables.length + 1,
      capacity: newTableCapacity,
      x: Math.random() * (layout.width - 80),
      y: Math.random() * (layout.height - 80),
      booked: false,
    };

    setLayout((prev) => ({
      ...prev,
      tables: [...prev.tables, newTable],
    }));
    setShowAddTable(false);
    setNewTableCapacity(4);
  };

  const removeTable = (id: string) => {
    setLayout((prev) => ({
      ...prev,
      tables: prev.tables.filter((t) => t.id !== id),
    }));
    setSelectedTable(null);
  };

  const updateTablePosition = (id: string, x: number, y: number) => {
    setLayout((prev) => ({
      ...prev,
      tables: prev.tables.map((t) =>
        t.id === id ? { ...t, x, y } : t
      ),
    }));
  };

  const saveLayout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('venue_layouts')
        .upsert({
          event_id: eventId,
          layout_data: layout,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      alert('Venue layout saved successfully!');
    } catch (err: any) {
      alert('Failed to save layout: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary rounded-lg p-6 border border-border/30 space-y-6">
      <h2 className="text-2xl font-bold text-text-light">Venue Layout Manager</h2>

      {/* Canvas */}
      <div className="relative bg-primary rounded-lg border border-border/30 overflow-auto" style={{ width: '100%', height: '400px' }}>
        <svg
          width={layout.width}
          height={layout.height}
          className="bg-primary"
          style={{ minWidth: '100%', minHeight: '100%' }}
        >
          {/* Grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#444" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={layout.width} height={layout.height} fill="url(#grid)" />

          {/* Tables */}
          {layout.tables.map((table) => (
            <g key={table.id}>
              <circle
                cx={table.x + 40}
                cy={table.y + 40}
                r="40"
                fill={table.booked ? '#ef4444' : '#fbbf24'}
                opacity={selectedTable === table.id ? 1 : 0.7}
                onClick={() => setSelectedTable(table.id)}
                style={{ cursor: 'pointer' }}
              />
              <text
                x={table.x + 40}
                y={table.y + 45}
                textAnchor="middle"
                fill="#000"
                fontSize="16"
                fontWeight="bold"
                pointerEvents="none"
              >
                {table.number}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Table Details */}
      {selectedTable && (
        <div className="bg-primary rounded-lg p-4 border border-border/30 space-y-3">
          {layout.tables.map((table) =>
            table.id === selectedTable ? (
              <div key={table.id} className="space-y-3">
                <h3 className="text-lg font-bold text-text-light">Table {table.number}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-text-dark text-sm">Capacity</p>
                    <p className="text-text-light font-semibold">{table.capacity} people</p>
                  </div>
                  <div>
                    <p className="text-text-dark text-sm">Status</p>
                    <p className={`font-semibold ${table.booked ? 'text-red-400' : 'text-green-400'}`}>
                      {table.booked ? 'Booked' : 'Available'}
                    </p>
                  </div>
                </div>
                {table.booked && table.bookedBy && (
                  <div>
                    <p className="text-text-dark text-sm">Booked by</p>
                    <p className="text-text-light font-semibold">{table.bookedBy}</p>
                    {table.bookingTime && (
                      <p className="text-text-dark text-xs mt-1">
                        Booked at: {new Date(table.bookingTime).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                <button
                  onClick={() => removeTable(table.id)}
                  className="w-full bg-red-500/10 border border-red-500/30 text-red-400 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  Remove Table
                </button>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Add Table */}
      {showAddTable && (
        <div className="bg-primary rounded-lg p-4 border border-border/30 space-y-3">
          <h3 className="text-lg font-bold text-text-light">Add New Table</h3>
          <div>
            <label className="block text-sm font-semibold text-text-light mb-2">Capacity</label>
            <input
              type="number"
              value={newTableCapacity}
              onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
              min="1"
              max="20"
              className="w-full bg-secondary border border-border/30 rounded px-3 py-2 text-text-light focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={addTable}
              className="flex-1 bg-accent text-primary py-2 rounded-lg font-semibold hover:bg-accent/90"
            >
              Add Table
            </button>
            <button
              onClick={() => setShowAddTable(false)}
              className="flex-1 bg-primary border border-border/30 text-text-light py-2 rounded-lg hover:border-accent/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {!showAddTable && (
          <button
            onClick={() => setShowAddTable(true)}
            className="flex-1 bg-accent text-primary py-3 rounded-lg font-semibold hover:bg-accent/90"
          >
            + Add Table
          </button>
        )}
        <button
          onClick={saveLayout}
          disabled={loading}
          className="flex-1 bg-green-500/10 border border-green-500/30 text-green-400 py-3 rounded-lg font-semibold hover:bg-green-500/20 disabled:opacity-50"
        >
          {loading ? 'Saving...' : '💾 Save Layout'}
        </button>
      </div>

      {/* Table Summary */}
      <div className="bg-primary rounded-lg p-4 border border-border/30">
        <h3 className="text-lg font-bold text-text-light mb-3">Table Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-text-dark text-sm">Total Tables</p>
            <p className="text-2xl font-bold text-accent">{layout.tables.length}</p>
          </div>
          <div>
            <p className="text-text-dark text-sm">Total Capacity</p>
            <p className="text-2xl font-bold text-accent">{layout.tables.reduce((sum, t) => sum + t.capacity, 0)}</p>
          </div>
          <div>
            <p className="text-text-dark text-sm">Booked Tables</p>
            <p className="text-2xl font-bold text-red-400">{layout.tables.filter((t) => t.booked).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
