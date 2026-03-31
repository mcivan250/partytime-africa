'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CartItem {
  merchandiseId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface MerchandiseItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sizes?: string[];
  colors?: string[];
}

export default function MerchandiseCheckout({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const [merchandise, setMerchandise] = useState<MerchandiseItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSize, setSelectedSize] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    fetchMerchandise();
  }, [eventId]);

  const fetchMerchandise = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_merchandise')
        .select('merchandise_data')
        .eq('event_id', eventId);

      if (error) throw error;

      const items = data?.map((d) => d.merchandise_data) || [];
      setMerchandise(items);
    } catch (error) {
      console.error('Error fetching merchandise:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MerchandiseItem) => {
    const size = selectedSize[item.id];
    const color = selectedColor[item.id];

    if ((item.sizes?.length || 0) > 0 && !size) {
      alert('Please select a size');
      return;
    }

    if ((item.colors?.length || 0) > 0 && !color) {
      alert('Please select a color');
      return;
    }

    const cartItem: CartItem = {
      merchandiseId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      size,
      color,
    };

    // Check if item with same options already in cart
    const existingItem = cart.find(
      (c) =>
        c.merchandiseId === item.id &&
        c.size === size &&
        c.color === color
    );

    if (existingItem) {
      setCart(
        cart.map((c) =>
          c === existingItem
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      );
    } else {
      setCart([...cart, cartItem]);
    }

    // Reset selections
    setSelectedSize({ ...selectedSize, [item.id]: '' });
    setSelectedColor({ ...selectedColor, [item.id]: '' });
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
    } else {
      const newCart = [...cart];
      newCart[index].quantity = quantity;
      setCart(newCart);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (!user) {
      alert('Please sign in to checkout');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    try {
      setLoading(true);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('merchandise_orders')
        .insert({
          user_id: user.id,
          event_id: eventId,
          items: cart,
          total_amount: calculateTotal(),
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Process payment
      const paymentResponse = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'initiate',
          amount: calculateTotal(),
          currency: 'UGX',
          email: user.email,
          provider: 'flutterwave',
          description: `Merchandise order for event ${eventId}`,
          metadata: {
            orderId: order.id,
            eventId,
            itemCount: cart.length,
          },
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        alert('Payment initiation failed: ' + paymentData.message);
        return;
      }

      // Redirect to payment
      if (paymentData.redirectUrl) {
        window.location.href = paymentData.redirectUrl;
      }
    } catch (error: any) {
      alert('Checkout error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && merchandise.length === 0) {
    return <div className="text-center py-8">Loading merchandise...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Merchandise Grid */}
      {!showCheckout && (
        <>
          <h2 className="text-2xl font-bold text-text-light">Event Merchandise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {merchandise.map((item) => (
              <div
                key={item.id}
                className="bg-primary rounded-lg p-4 border border-border/30 space-y-3"
              >
                <div>
                  <h3 className="font-bold text-text-light">{item.name}</h3>
                  <p className="text-2xl font-bold text-accent mt-2">
                    {item.price.toLocaleString()} UGX
                  </p>
                </div>

                {/* Sizes */}
                {(item.sizes?.length || 0) > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-text-light mb-2">Size</p>
                    <div className="flex flex-wrap gap-2">
                      {item.sizes?.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize({ ...selectedSize, [item.id]: size })}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            selectedSize[item.id] === size
                              ? 'bg-accent text-primary'
                              : 'bg-secondary border border-border/30 text-text-light hover:border-accent/50'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colors */}
                {(item.colors?.length || 0) > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-text-light mb-2">Color</p>
                    <div className="flex flex-wrap gap-2">
                      {item.colors?.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor({ ...selectedColor, [item.id]: color })}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            selectedColor[item.id] === color
                              ? 'bg-accent text-primary'
                              : 'bg-secondary border border-border/30 text-text-light hover:border-accent/50'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock */}
                <p className={`text-sm ${item.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {item.quantity > 0 ? `${item.quantity} in stock` : 'Out of stock'}
                </p>

                {/* Add to Cart Button */}
                <button
                  onClick={() => addToCart(item)}
                  disabled={item.quantity === 0}
                  className="w-full bg-accent text-primary py-2 rounded-lg font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  🛒 Add to Cart
                </button>
              </div>
            ))}
          </div>

          {/* Cart Button */}
          {cart.length > 0 && (
            <div className="fixed bottom-6 right-6 bg-accent text-primary px-6 py-3 rounded-full font-bold shadow-lg cursor-pointer hover:bg-accent/90 transition-colors"
              onClick={() => setShowCheckout(true)}
            >
              🛒 Cart ({cart.length})
            </div>
          )}
        </>
      )}

      {/* Checkout View */}
      {showCheckout && (
        <div className="space-y-6">
          <button
            onClick={() => setShowCheckout(false)}
            className="text-accent hover:underline"
          >
            ← Back to Merchandise
          </button>

          <h2 className="text-2xl font-bold text-text-light">Shopping Cart</h2>

          {cart.length === 0 ? (
            <div className="text-center py-8 text-text-dark">
              <p className="text-4xl mb-2">🛒</p>
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="bg-primary rounded-lg p-4 border border-border/30 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-text-light">{item.name}</p>
                      {item.size && <p className="text-sm text-text-dark">Size: {item.size}</p>}
                      {item.color && <p className="text-sm text-text-dark">Color: {item.color}</p>}
                      <p className="text-sm text-accent font-semibold mt-1">
                        {item.price.toLocaleString()} UGX × {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-border/30 rounded">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="px-2 py-1 hover:bg-secondary"
                        >
                          −
                        </button>
                        <span className="px-3 py-1 text-text-light">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="px-2 py-1 hover:bg-secondary"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="bg-secondary rounded-lg p-4 border border-border/30 space-y-2">
                <div className="flex justify-between text-text-light">
                  <span>Subtotal:</span>
                  <span>{calculateTotal().toLocaleString()} UGX</span>
                </div>
                <div className="flex justify-between text-text-light">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-border/30 pt-2 flex justify-between font-bold text-lg text-accent">
                  <span>Total:</span>
                  <span>{calculateTotal().toLocaleString()} UGX</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-accent text-primary py-3 rounded-lg font-bold hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : '💳 Proceed to Payment'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
