'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function UsageCounter() {
  const [remaining, setRemaining] = useState(7);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('pro');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('designBestiGuestCount');
    const used = parseInt(stored || '0', 10);
    setRemaining(isNaN(used) ? 7 : Math.max(0, 7 - used));
  }, []);

  const used = 7 - remaining;

  const handleUpgrade = () => {
    if (selectedPlan === 'pro') {
      alert('Pro plan coming soon! We will notify you when it launches.');
    } else {
      setIsOpen(false);
    }
  };

  const modal = (
    <div
      onClick={() => setIsOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0d0e1c',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '760px',
          padding: '40px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#5a47b0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px',
            }}
          >
            Design Besti Pro
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '8px',
            }}
          >
            Upgrade your design workflow
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
            Choose the plan that fits your needs
          </div>
        </div>

        {/* Plan Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px',
            alignItems: 'stretch',
          }}
        >
          {/* Free Plan */}
          <div
            onClick={() => setSelectedPlan('free')}
            style={{
              background: '#1a1b2e',
              border: selectedPlan === 'free' ? '2px solid #5a47b0' : '2px solid transparent',
              borderRadius: '12px',
              padding: '28px',
              cursor: 'pointer',
              minHeight: 360,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
              Free
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
              $0
              <span style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>
                /month
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>7 analyses/month</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>Core analysis</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>✗</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>Roast mode</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>✗</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>Stress test</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>✗</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>Stakeholder report</span>
              </div>
            </div>
          </div>

          {/* Pro Plan */}
          <div
            onClick={() => setSelectedPlan('pro')}
            style={{
              background: '#1a1b2e',
              border: selectedPlan === 'pro' ? '2px solid #5a47b0' : '2px solid transparent',
              borderRadius: '12px',
              padding: '28px',
              cursor: 'pointer',
              position: 'relative',
              minHeight: 360,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-10px',
                right: '12px',
                fontSize: '10px',
                fontWeight: 700,
                background: '#5a47b0',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '999px',
              }}
            >
              RECOMMENDED
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
              Pro
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
              $9
              <span style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>
                /month
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>Unlimited analyses</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>Roast mode</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>Stress test</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>Stakeholder report</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>First 5 seconds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Bar */}
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '12px',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Analyses used</span>
            <span style={{ color: '#5a47b0', fontWeight: 600 }}>
              {used} of 7
            </span>
          </div>
          <div
            style={{
              height: '6px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(used / 7) * 100}%`,
                background: '#5a47b0',
                borderRadius: '999px',
              }}
            />
          </div>
        </div>

        {/* Upgrade Button */}
        <button
          onClick={handleUpgrade}
          style={{
            background: '#fff',
            color: '#0d0e1c',
            border: 'none',
            borderRadius: '999px',
            padding: '16px 24px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            marginBottom: '16px',
            minHeight: '44px',
          }}
        >
          {selectedPlan === 'pro' ? 'Upgrade to Pro →' : 'Continue with Free'}
        </button>

        {/* Maybe Later */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '13px',
              cursor: 'pointer',
              padding: '8px',
              minHeight: '44px',
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 18px',
          borderRadius: '999px',
          border: 'none',
          background: '#5a47b0',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          minHeight: '44px',
        }}
      >
        {remaining} left · Upgrade Pro
      </button>
      {isOpen && mounted && createPortal(modal, document.body)}
    </>
  );
}
