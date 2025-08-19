import React, { useState } from 'react';

interface Risk {
  id: string;
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  category: 'technical' | 'business' | 'operational';
  mitigation: string[];
  contingency: string;
  owner: string;
  status: 'identified' | 'mitigated' | 'occurred' | 'avoided';
}

const RiskAssessmentMatrix: React.FC = () => {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [filterCategory, setFilterCategory] = useState<
    'all' | 'technical' | 'business' | 'operational'
  >('all');

  const risks: Risk[] = [
    {
      id: 'R001',
      title: 'Replication Lag Spike',
      description: 'Logical replication lag exceeds acceptable threshold during high traffic',
      probability: 'medium',
      impact: 'high',
      category: 'technical',
      mitigation: [
        'Monitor replication lag continuously with alerts',
        'Implement automatic scaling of read replicas',
        'Pre-warm target database with recent data',
        'Schedule migration during low-traffic window',
      ],
      contingency: 'Pause migration and wait for lag to decrease below 2 seconds',
      owner: 'Database Team',
      status: 'avoided',
    },
    {
      id: 'R002',
      title: 'Application Connection Failure',
      description: 'Application fails to establish connections to new database',
      probability: 'medium',
      impact: 'high',
      category: 'technical',
      mitigation: [
        'Implement connection pooling with retry logic',
        'Test connection strings in staging environment',
        'Deploy database abstraction layer with fallback',
        'Prepare emergency DNS rollback procedure',
      ],
      contingency: 'Immediate rollback to original database within 5 minutes',
      owner: 'Platform Team',
      status: 'mitigated',
    },
    {
      id: 'R003',
      title: 'Data Inconsistency',
      description: 'Data corruption or inconsistency during migration process',
      probability: 'low',
      impact: 'high',
      category: 'technical',
      mitigation: [
        'Implement comprehensive data validation scripts',
        'Perform checksums on critical tables',
        'Run parallel consistency checks during replication',
        'Maintain detailed audit logs of all changes',
      ],
      contingency: 'Stop migration and perform full data reconciliation',
      owner: 'Data Engineering',
      status: 'avoided',
    },
    {
      id: 'R004',
      title: 'Weekend Sales Impact',
      description: 'Migration affects critical weekend sales period',
      probability: 'low',
      impact: 'high',
      category: 'business',
      mitigation: [
        'Schedule migration for early Saturday morning',
        'Complete all operations before peak hours',
        'Coordinate with marketing team on timing',
        'Prepare communication for customer support',
      ],
      contingency: 'Delay migration to following weekend if issues arise',
      owner: 'Business Operations',
      status: 'avoided',
    },
    {
      id: 'R005',
      title: 'Performance Degradation',
      description: 'New database performs worse than expected',
      probability: 'medium',
      impact: 'medium',
      category: 'technical',
      mitigation: [
        'Conduct extensive load testing before migration',
        'Optimize queries and indexes proactively',
        'Prepare performance tuning scripts',
        'Monitor key performance metrics in real-time',
      ],
      contingency: 'Apply emergency performance optimizations or rollback',
      owner: 'Database Team',
      status: 'mitigated',
    },
    {
      id: 'R006',
      title: 'Team Coordination Issues',
      description: 'Poor communication leading to execution errors',
      probability: 'medium',
      impact: 'medium',
      category: 'operational',
      mitigation: [
        'Establish dedicated Slack channel for migration',
        'Conduct pre-migration dry run with all teams',
        'Create detailed runbook with clear responsibilities',
        'Assign primary and backup owners for each task',
      ],
      contingency: 'Escalation to incident commander for decision making',
      owner: 'Engineering Management',
      status: 'mitigated',
    },
    {
      id: 'R007',
      title: 'Monitoring System Failure',
      description: 'Critical monitoring systems fail during migration',
      probability: 'low',
      impact: 'medium',
      category: 'operational',
      mitigation: [
        'Deploy redundant monitoring systems',
        'Create backup alerting through multiple channels',
        'Prepare manual monitoring scripts',
        'Test all monitoring systems before migration',
      ],
      contingency: 'Switch to manual monitoring and extend validation time',
      owner: 'DevOps Team',
      status: 'avoided',
    },
    {
      id: 'R008',
      title: 'Rollback Complexity',
      description: 'Rollback process takes longer than expected',
      probability: 'medium',
      impact: 'high',
      category: 'operational',
      mitigation: [
        'Practice rollback procedures multiple times',
        'Automate rollback steps where possible',
        'Maintain parallel write capabilities during transition',
        'Document step-by-step rollback procedures',
      ],
      contingency: 'Accept extended downtime for safe rollback completion',
      owner: 'Platform Team',
      status: 'mitigated',
    },
    {
      id: 'R009',
      title: 'Third-party Service Integration',
      description: 'External services fail to connect to new database',
      probability: 'low',
      impact: 'low',
      category: 'technical',
      mitigation: [
        'Update all external service configurations',
        'Test integrations in staging environment',
        'Coordinate with third-party vendors',
        'Prepare backup integration methods',
      ],
      contingency: 'Temporarily disable non-critical integrations',
      owner: 'Integration Team',
      status: 'avoided',
    },
  ];

  const getRiskLevel = (probability: string, impact: string): string => {
    const score = {
      low: 1,
      medium: 2,
      high: 3,
    };

    const totalScore =
      score[probability as keyof typeof score] + score[impact as keyof typeof score];

    if (totalScore >= 5) return 'critical';
    if (totalScore >= 4) return 'high';
    if (totalScore >= 3) return 'medium';
    return 'low';
  };

  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'critical':
        return 'bg-light-800 border-card-border text-text-primary shadow-lg border-l-4 border-l-danger';
      case 'high':
        return 'bg-light-800 border-card-border text-text-primary shadow-md border-l-4 border-l-accent';
      case 'medium':
        return 'bg-light-700 border-card-border text-text-primary border-l-4 border-l-text-secondary';
      case 'low':
        return 'bg-light-700 border-card-border text-text-secondary border-l-4 border-l-accent';
      default:
        return 'bg-light-800 border-card-border text-text-secondary';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'avoided':
        return 'bg-accent';
      case 'mitigated':
        return 'bg-light-600';
      case 'occurred':
        return 'bg-danger';
      case 'identified':
        return 'bg-light-500';
      default:
        return 'bg-light-600';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'avoided':
        return '✓';
      case 'mitigated':
        return '🛡️';
      case 'occurred':
        return '⚠️';
      case 'identified':
        return '👁️';
      default:
        return '○';
    }
  };

  const filteredRisks =
    filterCategory === 'all' ? risks : risks.filter((risk) => risk.category === filterCategory);

  const riskStats = {
    total: risks.length,
    critical: risks.filter((r) => getRiskLevel(r.probability, r.impact) === 'critical').length,
    avoided: risks.filter((r) => r.status === 'avoided').length,
    mitigated: risks.filter((r) => r.status === 'mitigated').length,
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-surface-100 rounded-lg border border-card-border">
      <h3 className="text-xl font-bold text-text-primary mb-6">Migration Risk Assessment Matrix</h3>

      {/* Risk Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-light-800 p-4 rounded-lg border border-card-border text-center">
          <div className="text-2xl font-bold text-text-primary">{riskStats.total}</div>
          <div className="text-sm text-text-secondary">Total Risks</div>
        </div>
        <div className="bg-light-800 p-4 rounded-lg border border-card-border text-center border-l-4 border-l-danger">
          <div className="text-2xl font-bold text-text-primary">{riskStats.critical}</div>
          <div className="text-sm text-text-secondary">Critical Risks</div>
        </div>
        <div className="bg-light-800 p-4 rounded-lg border border-card-border text-center border-l-4 border-l-accent">
          <div className="text-2xl font-bold text-accent">{riskStats.avoided}</div>
          <div className="text-sm text-text-secondary">Risks Avoided</div>
        </div>
        <div className="bg-light-800 p-4 rounded-lg border border-card-border text-center border-l-4 border-l-light-600">
          <div className="text-2xl font-bold text-text-primary">{riskStats.mitigated}</div>
          <div className="text-sm text-text-secondary">Risks Mitigated</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'technical', 'business', 'operational'] as const).map((category) => (
          <button
            type="button"
            key={category}
            onClick={() => setFilterCategory(category)}
            className={`px-4 py-2 rounded-lg capitalize transition-all ${
              filterCategory === category
                ? 'bg-accent text-darker shadow-lg'
                : 'bg-light-800 text-text-secondary hover:bg-light-700 border border-card-border'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Risk Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {filteredRisks.map((risk) => {
          const riskLevel = getRiskLevel(risk.probability, risk.impact);
          return (
            <div
              key={risk.id}
              onClick={() => setSelectedRisk(risk)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedRisk(risk);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${risk.title}`}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${getRiskColor(riskLevel)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full ${getStatusColor(risk.status)} flex items-center justify-center text-darker text-xs mr-2 shadow-sm`}
                  >
                    {getStatusIcon(risk.status)}
                  </div>
                  <span className="font-mono text-sm text-text-secondary">{risk.id}</span>
                </div>
                <span className="text-xs px-2 py-1 bg-light-700 border border-card-border rounded capitalize text-text-secondary">
                  {risk.category}
                </span>
              </div>

              <h4 className="font-semibold text-text-primary mb-2">{risk.title}</h4>

              <div className="flex justify-between text-sm mb-2">
                <span>
                  Probability: <strong className="capitalize">{risk.probability}</strong>
                </span>
                <span>
                  Impact: <strong className="capitalize">{risk.impact}</strong>
                </span>
              </div>

              <div className="text-sm text-text-secondary mb-2">Owner: {risk.owner}</div>

              <div className="text-xs text-text-secondary">
                Click for detailed mitigation strategies
              </div>
            </div>
          );
        })}
      </div>

      {/* Risk Detail Modal */}
      {selectedRisk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface-100 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold text-text-primary">{selectedRisk.title}</h4>
                  <p className="text-text-secondary mt-1">{selectedRisk.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRisk(null)}
                  className="text-text-secondary hover:text-text-primary text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-light-800 border border-card-border p-3 rounded-lg">
                  <div className="text-sm text-text-secondary">Probability</div>
                  <div className="font-semibold capitalize text-text-primary">
                    {selectedRisk.probability}
                  </div>
                </div>
                <div className="bg-light-800 border border-card-border p-3 rounded-lg">
                  <div className="text-sm text-text-secondary">Impact</div>
                  <div className="font-semibold capitalize text-text-primary">
                    {selectedRisk.impact}
                  </div>
                </div>
                <div className="bg-light-800 border border-card-border p-3 rounded-lg">
                  <div className="text-sm text-text-secondary">Category</div>
                  <div className="font-semibold capitalize text-text-primary">
                    {selectedRisk.category}
                  </div>
                </div>
                <div className="bg-light-800 border border-card-border p-3 rounded-lg">
                  <div className="text-sm text-text-secondary">Status</div>
                  <div className="flex items-center">
                    <div
                      className={`w-4 h-4 rounded-full ${getStatusColor(selectedRisk.status)} mr-2 shadow-sm`}
                    ></div>
                    <span className="font-semibold capitalize text-text-primary">
                      {selectedRisk.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-text-primary mb-2">Mitigation Strategies:</h5>
                  <ul className="space-y-2">
                    {selectedRisk.mitigation.map((strategy, index) => (
                      <li
                        key={`strategy-${strategy.slice(0, 20)}-${index}`}
                        className="flex items-start"
                      >
                        <div className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-text-secondary">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-text-primary mb-2">Contingency Plan:</h5>
                  <p className="text-text-secondary">{selectedRisk.contingency}</p>
                </div>

                <div>
                  <h5 className="font-semibold text-text-primary mb-2">Owner:</h5>
                  <p className="text-text-secondary">{selectedRisk.owner}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-light-800 rounded-lg border border-card-border">
        <h5 className="font-semibold text-text-primary mb-3">Risk Status Legend:</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-accent mr-2 shadow-sm"></div>
            <span className="text-sm text-text-secondary">Avoided</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-light-600 mr-2 shadow-sm"></div>
            <span className="text-sm text-text-secondary">Mitigated</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-danger mr-2 shadow-sm"></div>
            <span className="text-sm text-text-secondary">Occurred</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-light-500 mr-2 shadow-sm"></div>
            <span className="text-sm text-text-secondary">Identified</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskAssessmentMatrix;
