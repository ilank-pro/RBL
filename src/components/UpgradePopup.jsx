import { useState } from 'react';

// Tier configuration
const TIERS = {
  bronze: {
    name: 'Bronze',
    price: '$4.95',
    period: '/month',
    icon: '🥉',
    color: '#cd7f32',
    features: [
      'Send emojis to opponents',
      'Set 5-10 rounds per game',
      'Adjust time: 60-120 seconds',
      '200 coins + 50/month',
      'Ad-free experience',
    ],
  },
  gold: {
    name: 'Gold',
    price: '$12.95',
    period: '/month',
    icon: '🥇',
    color: '#ffd700',
    popular: true,
    features: [
      'Everything in Bronze',
      'Skip 1 card per game',
      'Set up to 15 rounds',
      'Time range: 45-180 seconds',
      '500 coins + 150/month',
    ],
  },
  platinum: {
    name: 'Platinum',
    price: '$24.95',
    period: '/month',
    icon: '💎',
    color: '#e5e4e2',
    features: [
      'Everything in Gold',
      'Skip 3 cards per game',
      'Set up to 20 rounds',
      'Time range: 30-300 seconds',
      '1000 coins + 300/month',
      'Exclusive avatar frames',
    ],
  },
};

const COIN_PACKS = [
  { name: 'small', coins: 100, price: '$0.99' },
  { name: 'medium', coins: 350, price: '$2.99', bonus: '+50' },
  { name: 'large', coins: 700, price: '$4.99', bonus: '+150' },
  { name: 'mega', coins: 1600, price: '$9.99', bonus: '+400' },
];

export default function UpgradePopup({
  isOpen,
  onClose,
  trigger, // 'emoji', 'hint', 'settings', 'skip'
  currentTier = 'free',
  currentCoins = 0,
  onPurchaseTier,
  onPurchaseCoins,
}) {
  const [showCoinPacks, setShowCoinPacks] = useState(false);

  if (!isOpen) return null;

  const getTriggerMessage = () => {
    switch (trigger) {
      case 'emoji':
        return 'Upgrade to Bronze to send emojis!';
      case 'hint':
        return 'Need more coins for hints?';
      case 'settings':
        return 'Upgrade to customize your game!';
      case 'skip':
        return 'Skip cards with Gold or Platinum!';
      default:
        return 'Upgrade Your Game!';
    }
  };

  const handlePurchaseTier = (tier) => {
    if (onPurchaseTier) {
      onPurchaseTier(tier);
    }
    // In production, this would open Stripe checkout
    console.log('Purchase tier:', tier);
  };

  const handlePurchaseCoins = (pack) => {
    if (onPurchaseCoins) {
      onPurchaseCoins(pack);
    }
    // In production, this would open Stripe checkout
    console.log('Purchase coins:', pack);
  };

  return (
    <div className="upgrade-popup-overlay" onClick={onClose}>
      <div className="upgrade-popup" onClick={(e) => e.stopPropagation()}>
        <button className="upgrade-close-btn" onClick={onClose}>×</button>

        <h2 className="upgrade-title">🎮 {getTriggerMessage()}</h2>

        {currentTier !== 'free' && (
          <p className="upgrade-current-tier">
            Current tier: <span style={{ color: TIERS[currentTier]?.color }}>{TIERS[currentTier]?.icon} {TIERS[currentTier]?.name}</span>
          </p>
        )}

        <div className="upgrade-coins-display">
          💰 {currentCoins} coins
        </div>

        {!showCoinPacks ? (
          <>
            <div className="upgrade-tiers">
              {Object.entries(TIERS).map(([key, tier]) => {
                const isCurrentTier = currentTier === key;
                const isLowerTier =
                  (currentTier === 'gold' && key === 'bronze') ||
                  (currentTier === 'platinum' && (key === 'bronze' || key === 'gold'));

                return (
                  <div
                    key={key}
                    className={`upgrade-tier-card ${tier.popular ? 'popular' : ''} ${isCurrentTier ? 'current' : ''}`}
                    style={{ borderColor: tier.color }}
                  >
                    {tier.popular && <div className="popular-badge">⭐ POPULAR</div>}
                    {isCurrentTier && <div className="current-badge">YOUR TIER</div>}

                    <div className="tier-header">
                      <span className="tier-icon">{tier.icon}</span>
                      <span className="tier-name">{tier.name}</span>
                    </div>

                    <div className="tier-price">{tier.price}<span className="tier-period">{tier.period}</span></div>

                    <ul className="tier-features">
                      {tier.features.map((feature, idx) => (
                        <li key={idx}>✓ {feature}</li>
                      ))}
                    </ul>

                    <button
                      className="tier-buy-btn"
                      style={{ backgroundColor: tier.color }}
                      onClick={() => handlePurchaseTier(key)}
                      disabled={isCurrentTier || isLowerTier}
                    >
                      {isCurrentTier ? 'Current' : isLowerTier ? 'Owned' : `Get ${tier.name}`}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="upgrade-divider">
              <span>OR</span>
            </div>

            <button
              className="upgrade-coins-btn"
              onClick={() => setShowCoinPacks(true)}
            >
              💰 Just need coins? Buy a coin pack
            </button>
          </>
        ) : (
          <>
            <button
              className="upgrade-back-btn"
              onClick={() => setShowCoinPacks(false)}
            >
              ← Back to tiers
            </button>

            <div className="coin-packs">
              {COIN_PACKS.map((pack) => (
                <div key={pack.name} className="coin-pack-card">
                  <div className="coin-pack-amount">
                    💰 {pack.coins}
                    {pack.bonus && <span className="coin-bonus">{pack.bonus}</span>}
                  </div>
                  <button
                    className="coin-pack-btn"
                    onClick={() => handlePurchaseCoins(pack)}
                  >
                    {pack.price}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <button className="upgrade-later-btn" onClick={onClose}>
          Maybe Later
        </button>
      </div>
    </div>
  );
}
