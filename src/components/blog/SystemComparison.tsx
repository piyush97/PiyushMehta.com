import React, { useState } from 'react';

interface SystemData {
  hardware: number;
  software: number;
  maintenance: number;
  yearly: number;
}

interface SystemComparisonProps {
  macosData: SystemData;
  archData: SystemData;
}

const SystemComparison: React.FC<SystemComparisonProps> = ({ macosData, archData }) => {
  const [timeframe, setTimeframe] = useState<1 | 3 | 5>(3);

  const calculateTotal = (data: SystemData, years: number) => {
    return data.hardware + (data.software * years) + data.maintenance + (data.yearly * (years - 1));
  };

  const macosTotal = calculateTotal(macosData, timeframe);
  const archTotal = calculateTotal(archData, timeframe);
  const savings = macosTotal - archTotal;
  const savingsPercent = Math.round(((savings / macosTotal) * 100));

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  return (
    <div className="not-prose bg-surface-2 border border-border rounded-xl p-6 my-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-text-primary">
          Total Cost Comparison
        </h3>
        <div className="flex bg-surface-3 rounded-lg p-1">
          {[1, 3, 5].map((years) => (
            <button
              type="button"
              key={years}
              onClick={() => setTimeframe(years as 1 | 3 | 5)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                timeframe === years
                  ? 'bg-primary text-primary-foreground'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {years} year{years > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* macOS Column */}
        <div className="bg-surface-1 border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h4 className="font-semibold text-text-primary">macOS Setup</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">Hardware</span>
              <span className="font-mono text-text-primary">
                {formatCurrency(macosData.hardware)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Software/year</span>
              <span className="font-mono text-text-primary">
                {formatCurrency(macosData.software)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Maintenance</span>
              <span className="font-mono text-text-primary">
                {formatCurrency(macosData.maintenance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Yearly costs</span>
              <span className="font-mono text-text-primary">
                {formatCurrency(macosData.yearly)}
              </span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between font-semibold">
              <span className="text-text-primary">{timeframe} Year Total</span>
              <span className="font-mono text-lg text-text-primary">
                {formatCurrency(macosTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Arch Linux Column */}
        <div className="bg-surface-1 border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h4 className="font-semibold text-text-primary">Arch Linux Setup</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">Hardware</span>
              <span className="font-mono text-text-primary">
                {formatCurrency(archData.hardware)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Software/year</span>
              <span className="font-mono text-green-600">
                {formatCurrency(archData.software)} (Free!)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Maintenance</span>
              <span className="font-mono text-green-600">
                {formatCurrency(archData.maintenance)} (DIY)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Yearly costs</span>
              <span className="font-mono text-text-primary">
                {formatCurrency(archData.yearly)}
              </span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between font-semibold">
              <span className="text-text-primary">{timeframe} Year Total</span>
              <span className="font-mono text-lg text-text-primary">
                {formatCurrency(archTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Summary */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {formatCurrency(savings)} Saved
          </div>
          <div className="text-text-secondary">
            That's {savingsPercent}% less over {timeframe} year{timeframe > 1 ? 's' : ''}
          </div>
          <div className="text-sm text-text-secondary mt-2">
            Monthly savings: {formatCurrency(Math.round(savings / (timeframe * 12)))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-text-secondary">
        <p>
          * macOS costs include hardware, software licenses, AppleCare, and yearly upgrades.
          Arch Linux costs include hardware and minimal yearly expenses for premium services.
        </p>
      </div>
    </div>
  );
};

export default SystemComparison;