'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Table {
  id: string;
  number: number;
  capacity: number;
  x: number;
  y: number;
  booked: boolean;
  bookedBy?: string;
}

interface VenueLayout {
  eventId: string;
  tables: Table[];
  width: number;
  height: number;
}

export default function DragDropVenueLayout({ eventId }: { eventId: string }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<VenueLayout>({
    eventId,
    tables: [],
    width: 1000,
    height: 600,
  });

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  useEffect(() => {
    fetchLayout();
  }, [eventId]);

  const fetchLayout = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('venue_layouts')
        .select('layout_data')
        .eq('event_id', eventId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.layout_data) {
        setLayout(data.layout_data);
      }
    } catch (error) {
      console.error('Error fetching layout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableMouseDown = (e: React.MouseEvent, tableId: string) => {
    e.preventDefault();
    const table = layout.tables.find((t) => t.id === tableId);
    if (!table) return;

    setDraggingTable(tableId);
    setSelectedTable(tableId);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - table.x,
        y: e.clientY - rect.top - table.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTable || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, layout.width - 80));
    const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, layout.height - 80));

    setLayout((prev) => ({
      ...prev,
      tables: prev.tables.map((t) =>
        t.id === draggingTable ? { ...t, x: newX, y: newY } : t
      ),
    }));
  };

  const handleMouseUp = () => {
    setDraggingTable(null);
  };

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

  const saveLayout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('venue_layouts')
        .upsert({
          event_id: eventId,
          layout_data: layout,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      alert('Layout saved successfully!');
    } catch (error: any) {
      alert('Failed to save layout: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Canvas */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative bg-gradient-to-br from-primary to-secondary border-2 border-border/30 rounded-lg overflow-auto cursor-move"
        style={{ width: '100%', height: '500px' }}
      >
        {/* Grid Background */}
        <svg
          className="absolute inset-0 opacity-20 pointer-events-none"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#888" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Tables */}
        <div className="absolute inset-0">
          {layout.tables.map((table) => (
            <div
              key={table.id}
              onMouseDown={(e) => handleTableMouseDown(e, table.id)}
              onClick={() => setSelectedTable(table.id)}
              className={`absolute w-20 h-20 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-all ${
                table.booked
                  ? 'bg-red-500/30 border-2 border-red-500'
                  : selectedTable === table.id
                  ? 'bg-accent/30 border-2 border-accent shadow-lg'
                  : 'bg-yellow-500/30 border-2 border-yellow-500 hover:shadow-md'
              }`}
              style={{
                left: `${table.x}px`,
                top: `${table.y}px`,
                transform: draggingTable === table.id ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              <div className="text-center">
                <p className="font-bold text-text-light text-sm">{table.number}</p>
                <p className="text-xs text-text-dark">{table.capacity}</p>
              </div>
            </div>
          ))}
        </div>
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
                  <div>
                    <p className="text-text-dark text-sm">Position</p>
                    <p className="text-text-light font-semibold">({Math.round(table.x)}, {Math.round(table.y)})</p>
                  </div>
                </div>
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

      {/* Add Table Form */}
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

      {/* Summary */}
      <div className="bg-secondary border border-border/30 rounded-lg p-4">
        <h3 className="text-lg font-bold text-text-light mb-3">Layout Summary</h3>
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
