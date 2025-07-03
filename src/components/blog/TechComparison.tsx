import React, { useState } from 'react';

interface CompanyExample {
  name: string;
  logo: string;
  use_case: string;
  details: string;
  impact: string;
  stats: string;
}

const companies: CompanyExample[] = [
  {
    name: 'Netflix',
    logo: '🎬',
    use_case: 'Content Discovery',
    details: 'Instantly filters out irrelevant movies/shows before expensive database searches. Powers the "Continue Watching" and recommendation systems.',
    impact: 'Sub-second search across 15,000+ titles',
    stats: '99.7% faster content lookup'
  },
  {
    name: 'Google',
    logo: '🔍',
    use_case: 'Web Crawling',
    details: 'Prevents crawlers from revisiting the same URLs. Bloom filters check if a URL has been crawled before hitting the massive URL database.',
    impact: 'Crawls 50+ billion pages efficiently',
    stats: '90% reduction in duplicate crawls'
  },
  {
    name: 'Instagram',
    logo: '📷',
    use_case: 'Username Validation',
    details: 'Quick check if username "might be taken" before querying user database. Prevents most database hits during username selection.',
    impact: 'Handles 100M+ username checks daily',
    stats: '85% of checks never hit database'
  },
  {
    name: 'Facebook',
    logo: '👥',
    use_case: 'Spam Detection',
    details: 'Instantly identifies known spam patterns and malicious content before expensive ML model inference.',
    impact: 'Filters billions of posts in real-time',
    stats: '1000x faster than pure ML approach'
  },
  {
    name: 'Bitcoin',
    logo: '₿',
    use_case: 'Transaction Filtering',
    details: 'Lightweight clients use Bloom filters to identify relevant transactions without downloading entire blockchain.',
    impact: 'Enables mobile Bitcoin wallets',
    stats: '99.9% bandwidth reduction'
  },
  {
    name: 'Chrome',
    logo: '🌐',
    use_case: 'Safe Browsing',
    details: 'Local Bloom filter checks URLs against known malicious sites before querying Google\'s servers.',
    impact: 'Protects 3+ billion users instantly',
    stats: '95% of checks happen offline'
  }
];

export const TechComparison: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState<CompanyExample>(companies[0]);

  return (
    <div className="bg-gradient-card border border-card-border p-6 rounded-lg my-8 shadow-card">
      <h3 className="text-xl font-bold mb-6 text-text-primary text-center">
        🏢 How Big Tech Uses Bloom Filters
      </h3>
      
      {/* Company Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
        {companies.map((company) => (
          <button
            key={company.name}
            type="button"
            onClick={() => setSelectedCompany(company)}
            className={`p-3 rounded-lg text-center transition-all ${
              selectedCompany.name === company.name
                ? 'bg-accent text-darker shadow-lg scale-105'
                : 'bg-light-800 hover:bg-light-700 text-text-primary border border-card-border'
            }`}
          >
            <div className="text-2xl mb-1">{company.logo}</div>
            <div className="text-xs font-medium">{company.name}</div>
          </button>
        ))}
      </div>
      
      {/* Selected Company Details */}
      <div className="bg-light-800 rounded-lg p-6 shadow-card border border-card-border">
        <div className="flex items-center mb-4">
          <span className="text-4xl mr-4">{selectedCompany.logo}</span>
          <div>
            <h4 className="text-2xl font-bold text-text-primary">
              {selectedCompany.name}
            </h4>
            <p className="text-accent font-semibold">
              {selectedCompany.use_case}
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-semibold text-text-primary mb-2">
              How They Use It:
            </h5>
            <p className="text-text-secondary leading-relaxed">
              {selectedCompany.details}
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-accent/20 border border-accent/30 p-4 rounded-lg">
              <h6 className="font-semibold text-accent mb-1">
                📈 Business Impact
              </h6>
              <p className="text-text-secondary text-sm">
                {selectedCompany.impact}
              </p>
            </div>
            
            <div className="bg-light-700 border border-card-border p-4 rounded-lg">
              <h6 className="font-semibold text-text-primary mb-1">
                ⚡ Performance Stats
              </h6>
              <p className="text-accent text-sm font-mono">
                {selectedCompany.stats}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Comparison */}
      <div className="mt-6 bg-light-700 border border-card-border p-4 rounded-lg">
        <h5 className="font-semibold text-text-primary mb-3 text-center">
          ⚡ Traditional Database vs Bloom Filter
        </h5>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-red-500/20 border border-red-500/30 p-3 rounded">
            <h6 className="font-semibold text-red-600 mb-2">
              ❌ Without Bloom Filter
            </h6>
            <ul className="text-text-secondary space-y-1">
              <li>• Every check hits database</li>
              <li>• O(log n) lookup time</li>
              <li>• High server load</li>
              <li>• Expensive at scale</li>
            </ul>
          </div>
          <div className="bg-accent/20 border border-accent/30 p-3 rounded">
            <h6 className="font-semibold text-accent mb-2">
              ✅ With Bloom Filter
            </h6>
            <ul className="text-text-secondary space-y-1">
              <li>• Most checks avoid database</li>
              <li>• O(1) constant time</li>
              <li>• Minimal memory usage</li>
              <li>• Scales to billions of items</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};