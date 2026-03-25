'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/payment-types';

export default function CreatePaidEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    isPaidEvent: true,
  });

  const [ticketTypes, setTicketTypes] = useState([
    { name: 'Regular', price: 20, quantity: 100 },
  ]);

  const [paymentSettings, setPaymentSettings] = useState({
    acceptInstallments: true,
    minDownPayment: 35,
    paymentDeadline: 72, // hours before event
    autoCancel: true,
    payoutTiming: 'instant' as 'instant' | 'after_event',
  });

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', price: 0, quantity: 50 }]);
  };

  const updateTicket = (index: number, field: string, value: any) => {
    const updated = [...ticketTypes];
    updated[index] = { ...updated[index], [field]: value };
    setTicketTypes(updated);
  };

  const removeTicket = (index: number) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Create Paid Event
            </h1>
            <p className="text-gray-600">
              Set up tickets, pricing, and payment plans
            </p>
          </div>
          <Link href="/create" className="text-purple-600 hover:text-purple-700">
            ← Back
          </Link>
        </div>

        {/* Progress */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= num
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {num}
                </div>
                {num < 4 && (
                  <div
                    className={`w-12 h-1 ${
                      step > num ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Event Details */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Event Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={eventData.title}
                  onChange={(e) =>
                    setEventData({ ...eventData, title: e.target.value })
                  }
                  placeholder="Rooftop Sundowner Experience"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date *
                </label>
                <input
                  type="datetime-local"
                  value={eventData.date}
                  onChange={(e) =>
                    setEventData({ ...eventData, date: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!eventData.title || !eventData.date}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300"
              >
                Next: Set Up Tickets
              </button>
            </div>
          )}

          {/* Step 2: Ticket Types */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Ticket Types & Pricing</h2>

              {ticketTypes.map((ticket, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      Ticket Type #{index + 1}
                    </h3>
                    {ticketTypes.length > 1 && (
                      <button
                        onClick={() => removeTicket(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={ticket.name}
                        onChange={(e) =>
                          updateTicket(index, 'name', e.target.value)
                        }
                        placeholder="Regular, VIP, Early Bird"
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={ticket.quantity}
                        onChange={(e) =>
                          updateTicket(index, 'quantity', parseInt(e.target.value))
                        }
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (USD)
                    </label>
                    <input
                      type="number"
                      value={ticket.price}
                      onChange={(e) =>
                        updateTicket(index, 'price', parseFloat(e.target.value))
                      }
                      step="0.01"
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Guests will see: {formatCurrency(ticket.price * 100)}
                    </p>
                  </div>
                </div>
              ))}

              <button
                onClick={addTicketType}
                className="w-full border-2 border-dashed border-purple-300 text-purple-600 py-3 rounded-lg font-semibold hover:bg-purple-50"
              >
                + Add Another Ticket Type
              </button>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700"
                >
                  Next: Payment Options
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment Settings */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Payment Options</h2>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="text-2xl">💡</div>
                  <div>
                    <h3 className="font-bold text-purple-900 mb-2">
                      Enable Installment Plans
                    </h3>
                    <p className="text-purple-700 text-sm mb-3">
                      Let guests pay over time to increase sales. Studies show installments boost conversion by 40%.
                    </p>
                  </div>
                </div>
                <label className="flex items-center space-x-3 mt-4">
                  <input
                    type="checkbox"
                    checked={paymentSettings.acceptInstallments}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        acceptInstallments: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-purple-600"
                  />
                  <span className="font-semibold text-purple-900">
                    Accept installment payments
                  </span>
                </label>
              </div>

              {paymentSettings.acceptInstallments && (
                <div className="space-y-6 pl-6 border-l-4 border-purple-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Down Payment
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="20"
                        max="50"
                        step="5"
                        value={paymentSettings.minDownPayment}
                        onChange={(e) =>
                          setPaymentSettings({
                            ...paymentSettings,
                            minDownPayment: parseInt(e.target.value),
                          })
                        }
                        className="flex-1"
                      />
                      <span className="font-bold text-purple-600 text-xl w-16">
                        {paymentSettings.minDownPayment}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Guests must pay at least {paymentSettings.minDownPayment}% upfront
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Deadline
                    </label>
                    <select
                      value={paymentSettings.paymentDeadline}
                      onChange={(e) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          paymentDeadline: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                    >
                      <option value="24">24 hours before event</option>
                      <option value="48">48 hours (2 days) before</option>
                      <option value="72">72 hours (3 days) before</option>
                      <option value="168">1 week before</option>
                    </select>
                  </div>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={paymentSettings.autoCancel}
                      onChange={(e) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          autoCancel: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-purple-600"
                    />
                    <span className="text-gray-700">
                      Auto-cancel tickets with unpaid installments
                    </span>
                  </label>
                </div>
              )}

              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When do you want to get paid?
                </label>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payout"
                      checked={paymentSettings.payoutTiming === 'instant'}
                      onChange={() =>
                        setPaymentSettings({
                          ...paymentSettings,
                          payoutTiming: 'instant',
                        })
                      }
                      className="mt-1"
                    />
                    <div>
                      <div className="font-semibold">Instant (Recommended)</div>
                      <div className="text-sm text-gray-600">
                        Money goes to your wallet immediately. Withdraw anytime.
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payout"
                      checked={paymentSettings.payoutTiming === 'after_event'}
                      onChange={() =>
                        setPaymentSettings({
                          ...paymentSettings,
                          payoutTiming: 'after_event',
                        })
                      }
                      className="mt-1"
                    />
                    <div>
                      <div className="font-semibold">After Event</div>
                      <div className="text-sm text-gray-600">
                        Released 24 hours after event ends. Extra protection.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700"
                >
                  Review & Create
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Review Your Event</h2>

              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Event Name</p>
                  <p className="font-bold text-lg">{eventData.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold">
                    {new Date(eventData.date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Tickets</p>
                  {ticketTypes.map((ticket, i) => (
                    <div key={i} className="flex justify-between py-2">
                      <span>
                        {ticket.name} (×{ticket.quantity})
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(ticket.price * 100)}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Options</p>
                  <p className="font-semibold">
                    {paymentSettings.acceptInstallments
                      ? `Installments enabled (${paymentSettings.minDownPayment}% down)`
                      : 'Full payment only'}
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="font-bold text-green-900 mb-2">
                  💰 Estimated Revenue
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(
                    ticketTypes.reduce(
                      (sum, t) => sum + t.price * t.quantity * 100,
                      0
                    )
                  )}
                </p>
                <p className="text-sm text-green-700 mt-2">
                  If all {ticketTypes.reduce((sum, t) => sum + t.quantity, 0)} tickets sell out
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => alert('Event created! 🎉')}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700"
                >
                  Create Paid Event 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
