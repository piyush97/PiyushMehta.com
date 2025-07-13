import React, { useState, useEffect } from 'react';

interface MetricData {
  name: string;
  before: number;
  after: number;
  unit: string;
  improvement: number;
  category: 'performance' | 'cost' | 'capacity';
  description: string;
}

const PerformanceMetrics: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'performance' | 'cost' | 'capacity'>('all');
  const [animationComplete, setAnimationComplete] = useState(false);

  const metricsData: MetricData[] = [
    {
      name: 'Query Response Time (95th percentile)',
      before: 2300,
      after: 700,
      unit: 'ms',
      improvement: 69.6,
      category: 'performance',
      description: 'Significant improvement in query performance due to better indexing and hardware'
    },
    {
      name: 'Database Throughput',
      before: 15000,
      after: 45000,
      unit: 'QPS',
      improvement: 200,
      category: 'performance',
      description: 'Tripled query processing capacity with new architecture'
    },
    {
      name: 'Connection Pool Utilization',
      before: 85,
      after: 45,
      unit: '%',
      improvement: 47.1,
      category: 'performance',
      description: 'More efficient connection management reducing resource contention'
    },
    {
      name: 'Monthly Infrastructure Cost',
      before: 28250,
      after: 18300,
      unit: '$',
      improvement: 35.2,
      category: 'cost',
      description: 'Aurora Serverless v2 provides better price-performance ratio'
    },
    {
      name: 'Storage Cost per TB',
      before: 100,
      after: 70,
      unit: '$',
      improvement: 30,
      category: 'cost',
      description: 'Aurora storage pricing more efficient than traditional RDS'
    },
    {
      name: 'Backup Storage Cost',
      before: 2000,
      after: 800,
      unit: '$',
      improvement: 60,
      category: 'cost',
      description: 'Aurora backup system more cost-effective'
    },
    {
      name: 'Maximum Concurrent Users',
      before: 50000,
      after: 500000,
      unit: 'users',
      improvement: 900,
      category: 'capacity',
      description: '10x capacity increase to support future growth'
    },
    {
      name: 'Read Replica Lag',
      before: 2500,
      after: 150,
      unit: 'ms',
      improvement: 94,
      category: 'capacity',
      description: 'Aurora read replicas provide near real-time consistency'
    },
    {
      name: 'Auto-scaling Response Time',
      before: 600,
      after: 45,
      unit: 'seconds',
      improvement: 92.5,
      category: 'capacity',
      description: 'Aurora Serverless v2 scales much faster than traditional instances'
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredMetrics = selectedCategory === 'all' 
    ? metricsData 
    : metricsData.filter(metric => metric.category === selectedCategory);

  const formatValue = (value: number, unit: string) => {
    if (unit === '$') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M ${unit}`;
    }
    
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K ${unit}`;
    }
    
    return `${value} ${unit}`;
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement >= 50) return 'text-green-600';
    if (improvement >= 25) return 'text-blue-600';
    return 'text-orange-600';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return '⚡';
      case 'cost': return '💰';
      case 'capacity': return '📈';
      default: return '📊';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance': return 'bg-blue-100 text-blue-800';
      case 'cost': return 'bg-green-100 text-green-800';
      case 'capacity': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-surface-100 rounded-lg border border-card-border">
      <h3 className="text-xl font-bold text-text-primary mb-6">
        Migration Performance Results
      </h3>
      
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'performance', 'cost', 'capacity'] as const).map((category) => (
          <button
            type="button"
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg capitalize transition-all ${
              selectedCategory === category
                ? 'bg-accent text-white'
                : 'bg-card-bg text-text-secondary hover:bg-accent/20'
            }`}
          >
            {category === 'all' ? '📊 All Metrics' : `${getCategoryIcon(category)} ${category}`}
          </button>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMetrics.map((metric, index) => (
          <div
            key={metric.name}
            className="bg-card-bg rounded-lg p-6 border border-card-border hover:shadow-lg transition-all duration-300"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: animationComplete ? 'none' : 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-semibold text-text-primary mb-1">
                  {metric.name}
                </h4>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(metric.category)}`}>
                  {getCategoryIcon(metric.category)} {metric.category}
                </span>
              </div>
              <div className={`text-2xl font-bold ${getImprovementColor(metric.improvement)}`}>
                {metric.improvement >= 0 ? '+' : ''}{metric.improvement.toFixed(1)}%
              </div>
            </div>

            {/* Before/After Comparison */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Before:</span>
                <span className="font-mono text-lg text-red-600">
                  {formatValue(metric.before, metric.unit)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">After:</span>
                <span className="font-mono text-lg text-green-600">
                  {formatValue(metric.after, metric.unit)}
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-text-secondary mb-1">
                <span>Performance Gain</span>
                <span>{metric.improvement.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    metric.improvement >= 50 ? 'bg-green-500' :
                    metric.improvement >= 25 ? 'bg-blue-500' : 'bg-orange-500'
                  }`}
                  style={{ 
                    width: animationComplete ? `${Math.min(metric.improvement, 100)}%` : '0%' 
                  }}
                ></div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-text-secondary">
              {metric.description}
            </p>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">0%</div>
          <div className="text-sm text-green-800">Downtime During Migration</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">300%</div>
          <div className="text-sm text-blue-800">Average Performance Improvement</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">10x</div>
          <div className="text-sm text-purple-800">Capacity Increase</div>
        </div>
      </div>

      {/* Business Impact */}
      <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
        <h5 className="font-semibold text-text-primary mb-2">💼 Business Impact</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Revenue Protection:</strong> Zero revenue loss during migration weekend
          </div>
          <div>
            <strong>User Experience:</strong> 40% faster page load times
          </div>
          <div>
            <strong>Operational Efficiency:</strong> 35% reduction in infrastructure costs
          </div>
          <div>
            <strong>Future Readiness:</strong> 10x capacity for continued growth
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default PerformanceMetrics;