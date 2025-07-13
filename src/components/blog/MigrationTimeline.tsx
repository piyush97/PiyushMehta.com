import React, { useState } from 'react';

interface TimelineEvent {
  time: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'critical';
  details: string[];
  metrics?: {
    replicationLag?: string;
    connections?: string;
    responseTime?: string;
  };
}

const MigrationTimeline: React.FC = () => {
  const [selectedHour, setSelectedHour] = useState<number>(0);
  
  const timelineData: TimelineEvent[] = [
    {
      time: '2:00 AM',
      title: 'Preparation Phase',
      description: 'Final validation and preparation for cutover',
      status: 'completed',
      details: [
        'Disabled logical replication subscription',
        'Ran comprehensive data validation script',
        'Enabled maintenance mode for write operations',
        'Notified stakeholders of cutover start',
        'Verified all monitoring systems operational'
      ],
      metrics: {
        replicationLag: '0.8s',
        connections: '45/200',
        responseTime: '2.1s'
      }
    },
    {
      time: '3:00 AM',
      title: 'Database Switch',
      description: 'Critical cutover operations executed',
      status: 'completed',
      details: [
        'Updated DNS to point to new database cluster',
        'Modified feature flags to route 100% traffic',
        'Performed rolling restart of application servers',
        'Validated new connection establishment',
        'Confirmed zero connection errors'
      ],
      metrics: {
        replicationLag: 'N/A',
        connections: '52/200',
        responseTime: '1.9s'
      }
    },
    {
      time: '4:00 AM',
      title: 'Validation & Issues',
      description: 'System validation and critical issue resolution',
      status: 'critical',
      details: [
        'Discovered connection pool exhaustion (resolved)',
        'Implemented emergency connection scaling',
        'Ran post-migration validation suite',
        'Identified and resolved cache inconsistencies',
        'Confirmed all critical user flows working'
      ],
      metrics: {
        replicationLag: 'N/A',
        connections: '89/200',
        responseTime: '0.9s'
      }
    },
    {
      time: '5:00 AM',
      title: 'Optimization & Monitoring',
      description: 'Performance optimization and monitoring setup',
      status: 'completed',
      details: [
        'Updated database statistics (ANALYZE)',
        'Created missing performance indexes',
        'Configured enhanced monitoring alerts',
        'Warmed critical application caches',
        'Validated business metrics alignment'
      ],
      metrics: {
        replicationLag: 'N/A',
        connections: '61/200',
        responseTime: '0.7s'
      }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'pending': return 'bg-gray-400';
      case 'critical': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in-progress': return '⟳';
      case 'pending': return '○';
      case 'critical': return '⚠';
      default: return '○';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-surface-100 rounded-lg border border-card-border">
      <h3 className="text-xl font-bold text-text-primary mb-6">
        Migration Cutover Timeline (4-Hour Window)
      </h3>
      
      {/* Timeline Navigation */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {timelineData.map((event, index) => (
          <button
            type="button"
            key={`timeline-${index}`}
            onClick={() => setSelectedHour(index)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              selectedHour === index
                ? 'bg-accent text-white'
                : 'bg-card-bg text-text-secondary hover:bg-accent/20'
            }`}
          >
            {event.time}
          </button>
        ))}
      </div>

      {/* Selected Hour Details */}
      <div className="bg-card-bg rounded-lg p-6 border border-card-border">
        <div className="flex items-center mb-4">
          <div className={`w-8 h-8 rounded-full ${getStatusColor(timelineData[selectedHour].status)} flex items-center justify-center text-white font-bold mr-3`}>
            {getStatusIcon(timelineData[selectedHour].status)}
          </div>
          <div>
            <h4 className="text-lg font-semibold text-text-primary">
              {timelineData[selectedHour].title}
            </h4>
            <p className="text-text-secondary">
              {timelineData[selectedHour].description}
            </p>
          </div>
        </div>

        {/* Metrics */}
        {timelineData[selectedHour].metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-surface-100 p-3 rounded-lg">
              <div className="text-sm text-text-secondary">Replication Lag</div>
              <div className="text-xl font-bold text-text-primary">
                {timelineData[selectedHour].metrics!.replicationLag}
              </div>
            </div>
            <div className="bg-surface-100 p-3 rounded-lg">
              <div className="text-sm text-text-secondary">Active Connections</div>
              <div className="text-xl font-bold text-text-primary">
                {timelineData[selectedHour].metrics!.connections}
              </div>
            </div>
            <div className="bg-surface-100 p-3 rounded-lg">
              <div className="text-sm text-text-secondary">Avg Response Time</div>
              <div className="text-xl font-bold text-text-primary">
                {timelineData[selectedHour].metrics!.responseTime}
              </div>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="space-y-3">
          <h5 className="font-semibold text-text-primary">Actions Performed:</h5>
          <ul className="space-y-2">
            {timelineData[selectedHour].details.map((detail, index) => (
              <li key={`detail-${index}`} className="flex items-start">
                <div className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-text-secondary">{detail}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Critical Issue Callout */}
        {timelineData[selectedHour].status === 'critical' && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-orange-600 mr-2">⚠️</span>
              <span className="font-semibold text-orange-800">Critical Issue Resolved</span>
            </div>
            <p className="text-orange-700 text-sm">
              Connection pool exhaustion detected and resolved within 15 minutes using emergency scaling procedures. 
              This demonstrates the importance of having detailed rollback and scaling plans ready.
            </p>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text-secondary">Migration Progress</span>
          <span className="text-sm font-semibold text-text-primary">
            {Math.round(((selectedHour + 1) / timelineData.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${((selectedHour + 1) / timelineData.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default MigrationTimeline;