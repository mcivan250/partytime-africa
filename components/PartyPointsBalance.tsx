'use client';

import React, { useEffect, useState } from 'react';
import {
  getUserPartyPoints,
  redeemPartyPoints,
  PartyPoints,
} from '@/lib/affiliate-moments';
import { useAuth } from '@/contexts/AuthContext';

interface PartyPointsBalanceProps {
  compact?: boolean;
  showRedeemButton?: boolean;
}

export default function PartyPointsBalance({
  compact = false,
  showRedeemButton = true,
}: PartyPointsBalanceProps) {
  const { user } = useAuth();
  const [points, setPoints] = useState<PartyPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState(100);
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadPoints();
    const interval = setInterval(loadPoints, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  const loadPoints = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getUserPartyPoints(user.id);
    setPoints(data);
    setLoading(false);
  };

  const handleRedeem = async () => {
    if (!user || redeeming || redeemAmount < 100) return;
    setRedeeming(true);
    const result = await redeemPartyPoints(user.id, redeemAmount);
    if (result) {
      setDiscountCode(result.discountCode);
      await loadPoints();
      setTimeout(() => {
        setShowRedeemModal(false);
        setDiscountCode(null);
        setRedeemAmount(100);
      }, 3000);
    }
    setRedeeming(false);
  };

  if (!user) {
    return (
      <div className="party-points-card">
        <p>Sign in to view your Party Points</p>
      </div>
    );
  }

  if (loading) {
    return <div className="party-points-card loading">Loading...</div>;
  }

  const balance = points?.available_points || 0;
  const total = points?.total_points || 0;
  const redeemed = points?.redeemed_points || 0;
  const maxRedeemable = Math.floor(balance / 100) * 100;

  if (compact) {
    return (
      <div className="party-points-compact">
        <div className="points-badge">
          <span className="icon">⭐</span>
          <span className="amount">{Math.floor(balance)}</span>
          <span className="label">Points</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="party-points-card">
        <div className="points-header">
          <h3>⭐ Party Points</h3>
          <p className="subtitle">Earn points by sharing Moments, redeem for discounts</p>
        </div>

        <div className="points-display">
          <div className="points-circle">
            <span className="points-value">{Math.floor(balance)}</span>
            <span className="points-label">Available</span>
          </div>

          <div className="points-breakdown">
            <div className="breakdown-item">
              <span className="label">Total Earned</span>
              <span className="value">{Math.floor(total)}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">Redeemed</span>
              <span className="value">{Math.floor(redeemed)}</span>
            </div>
          </div>
        </div>

        <div className="redemption-info">
          <p className="exchange-rate">💰 100 Points = $1 Discount</p>
          <p className="max-redeem">
            You can redeem up to <strong>${Math.floor(maxRedeemable / 100)}</strong> right now
          </p>
        </div>

        {showRedeemButton && maxRedeemable >= 100 && (
          <button
            className="redeem-btn"
            onClick={() => setShowRedeemModal(true)}
          >
            Redeem Points
          </button>
        )}

        {maxRedeemable < 100 && (
          <p className="no-redeem">
            Earn 100 points to unlock redemption. Share more Moments!
          </p>
        )}
      </div>

      {showRedeemModal && (
        <div className="modal-overlay" onClick={() => setShowRedeemModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Redeem Party Points</h2>

            {discountCode ? (
              <div className="success-state">
                <div className="success-icon">✅</div>
                <h3>Redemption Successful!</h3>
                <p>Your discount code is ready to use</p>
                <div className="discount-code-display">
                  <code>{discountCode}</code>
                  <button
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(discountCode);
                      alert('Copied to clipboard!');
                    }}
                  >
                    Copy
                  </button>
                </div>
                <p className="discount-value">
                  You saved ${Math.floor(redeemAmount / 100)}!
                </p>
              </div>
            ) : (
              <>
                <div className="redeem-slider">
                  <label>Points to Redeem</label>
                  <input
                    type="range"
                    min="100"
                    max={balance}
                    step="100"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(Number(e.target.value))}
                  />
                  <div className="slider-display">
                    <span className="points">{redeemAmount} Points</span>
                    <span className="equals">=</span>
                    <span className="value">${Math.floor(redeemAmount / 100)}</span>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="cancel-btn"
                    onClick={() => setShowRedeemModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="confirm-btn"
                    onClick={handleRedeem}
                    disabled={redeeming || redeemAmount < 100}
                  >
                    {redeeming ? 'Processing...' : 'Redeem Now'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
