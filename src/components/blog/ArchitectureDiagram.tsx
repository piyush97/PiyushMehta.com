import React, { useState } from 'react';

const ArchitectureDiagram: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<number>(0);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const phases = [
    {
      title: 'Phase 1: Current Architecture',
      description: 'Existing PostgreSQL 12 setup with performance limitations',
      components: [
        { id: 'app1', label: 'App Server 1', type: 'application', x: 50, y: 100 },
        { id: 'app2', label: 'App Server 2', type: 'application', x: 150, y: 100 },
        { id: 'app3', label: 'App Server 3', type: 'application', x: 250, y: 100 },
        { id: 'lb1', label: 'Load Balancer', type: 'load-balancer', x: 150, y: 200 },
        { id: 'db1', label: 'PostgreSQL 12\nPrimary', type: 'database-old', x: 100, y: 300 },
        { id: 'db2', label: 'Read Replica 1', type: 'database-replica', x: 200, y: 300 },
        { id: 'db3', label: 'Read Replica 2', type: 'database-replica', x: 300, y: 300 },
      ],
      connections: [
        { from: 'app1', to: 'lb1' },
        { from: 'app2', to: 'lb1' },
        { from: 'app3', to: 'lb1' },
        { from: 'lb1', to: 'db1' },
        { from: 'db1', to: 'db2' },
        { from: 'db1', to: 'db3' },
      ],
    },
    {
      title: 'Phase 2: Replication Setup',
      description: 'Logical replication established between old and new systems',
      components: [
        { id: 'app1', label: 'App Server 1', type: 'application', x: 50, y: 100 },
        { id: 'app2', label: 'App Server 2', type: 'application', x: 150, y: 100 },
        { id: 'app3', label: 'App Server 3', type: 'application', x: 250, y: 100 },
        { id: 'lb1', label: 'Load Balancer', type: 'load-balancer', x: 150, y: 200 },
        { id: 'db1', label: 'PostgreSQL 12\nPrimary', type: 'database-old', x: 80, y: 300 },
        { id: 'db2', label: 'Read Replica 1', type: 'database-replica', x: 180, y: 300 },
        { id: 'repl', label: 'Logical\nReplication', type: 'replication', x: 300, y: 250 },
        {
          id: 'aurora1',
          label: 'Aurora PostgreSQL 14\nPrimary',
          type: 'database-new',
          x: 400,
          y: 300,
        },
        {
          id: 'aurora2',
          label: 'Aurora\nRead Replica',
          type: 'database-replica-new',
          x: 500,
          y: 300,
        },
      ],
      connections: [
        { from: 'app1', to: 'lb1' },
        { from: 'app2', to: 'lb1' },
        { from: 'app3', to: 'lb1' },
        { from: 'lb1', to: 'db1' },
        { from: 'db1', to: 'db2' },
        { from: 'db1', to: 'repl', type: 'replication' },
        { from: 'repl', to: 'aurora1', type: 'replication' },
        { from: 'aurora1', to: 'aurora2' },
      ],
    },
    {
      title: 'Phase 3: Dual Database Mode',
      description: 'Applications updated to support both databases with feature flags',
      components: [
        {
          id: 'app1',
          label: 'App Server 1\n(Updated)',
          type: 'application-updated',
          x: 50,
          y: 100,
        },
        {
          id: 'app2',
          label: 'App Server 2\n(Updated)',
          type: 'application-updated',
          x: 150,
          y: 100,
        },
        {
          id: 'app3',
          label: 'App Server 3\n(Updated)',
          type: 'application-updated',
          x: 250,
          y: 100,
        },
        { id: 'ff', label: 'Feature Flags\n(Redis)', type: 'feature-flags', x: 150, y: 180 },
        { id: 'db1', label: 'PostgreSQL 12\nPrimary', type: 'database-old', x: 80, y: 300 },
        {
          id: 'aurora1',
          label: 'Aurora PostgreSQL 14\nPrimary',
          type: 'database-new',
          x: 220,
          y: 300,
        },
        {
          id: 'aurora2',
          label: 'Aurora\nRead Replica',
          type: 'database-replica-new',
          x: 320,
          y: 300,
        },
        { id: 'monitor', label: 'Monitoring\n(Grafana)', type: 'monitoring', x: 400, y: 180 },
      ],
      connections: [
        { from: 'app1', to: 'ff' },
        { from: 'app2', to: 'ff' },
        { from: 'app3', to: 'ff' },
        { from: 'ff', to: 'db1', type: 'conditional' },
        { from: 'ff', to: 'aurora1', type: 'conditional' },
        { from: 'aurora1', to: 'aurora2' },
        { from: 'app1', to: 'monitor', type: 'monitoring' },
        { from: 'aurora1', to: 'monitor', type: 'monitoring' },
      ],
    },
    {
      title: 'Phase 4: Full Migration',
      description: 'Complete cutover to Aurora PostgreSQL 14 with enhanced monitoring',
      components: [
        { id: 'app1', label: 'App Server 1', type: 'application', x: 50, y: 100 },
        { id: 'app2', label: 'App Server 2', type: 'application', x: 150, y: 100 },
        { id: 'app3', label: 'App Server 3', type: 'application', x: 250, y: 100 },
        { id: 'lb1', label: 'Load Balancer\n(Updated)', type: 'load-balancer', x: 150, y: 200 },
        {
          id: 'aurora1',
          label: 'Aurora PostgreSQL 14\nPrimary',
          type: 'database-new',
          x: 100,
          y: 300,
        },
        {
          id: 'aurora2',
          label: 'Aurora\nRead Replica 1',
          type: 'database-replica-new',
          x: 200,
          y: 300,
        },
        {
          id: 'aurora3',
          label: 'Aurora\nRead Replica 2',
          type: 'database-replica-new',
          x: 300,
          y: 300,
        },
        { id: 'monitor', label: 'Enhanced\nMonitoring', type: 'monitoring', x: 400, y: 250 },
        { id: 'backup', label: 'Aurora\nBackups', type: 'backup', x: 50, y: 400 },
      ],
      connections: [
        { from: 'app1', to: 'lb1' },
        { from: 'app2', to: 'lb1' },
        { from: 'app3', to: 'lb1' },
        { from: 'lb1', to: 'aurora1' },
        { from: 'aurora1', to: 'aurora2' },
        { from: 'aurora1', to: 'aurora3' },
        { from: 'aurora1', to: 'monitor', type: 'monitoring' },
        { from: 'aurora1', to: 'backup', type: 'backup' },
      ],
    },
  ];

  const getComponentStyle = (type: string) => {
    const baseStyle =
      'rounded-lg border-2 p-2 text-xs font-medium cursor-pointer transition-all hover:shadow-lg';

    switch (type) {
      case 'application':
        return `${baseStyle} bg-blue-100 border-blue-300 text-blue-800`;
      case 'application-updated':
        return `${baseStyle} bg-blue-200 border-blue-400 text-blue-900 shadow-lg`;
      case 'load-balancer':
        return `${baseStyle} bg-purple-100 border-purple-300 text-purple-800`;
      case 'database-old':
        return `${baseStyle} bg-red-100 border-red-300 text-red-800`;
      case 'database-new':
        return `${baseStyle} bg-green-100 border-green-300 text-green-800 shadow-lg`;
      case 'database-replica':
        return `${baseStyle} bg-orange-100 border-orange-300 text-orange-800`;
      case 'database-replica-new':
        return `${baseStyle} bg-emerald-100 border-emerald-300 text-emerald-800`;
      case 'replication':
        return `${baseStyle} bg-yellow-100 border-yellow-300 text-yellow-800`;
      case 'feature-flags':
        return `${baseStyle} bg-indigo-100 border-indigo-300 text-indigo-800`;
      case 'monitoring':
        return `${baseStyle} bg-cyan-100 border-cyan-300 text-cyan-800`;
      case 'backup':
        return `${baseStyle} bg-gray-100 border-gray-300 text-gray-800`;
      default:
        return `${baseStyle} bg-gray-100 border-gray-300 text-gray-800`;
    }
  };

  const getConnectionStyle = (type?: string) => {
    switch (type) {
      case 'replication':
        return 'stroke-yellow-500 stroke-2 stroke-dasharray-4';
      case 'conditional':
        return 'stroke-indigo-500 stroke-2 stroke-dasharray-2';
      case 'monitoring':
        return 'stroke-cyan-500 stroke-1 stroke-dasharray-1';
      case 'backup':
        return 'stroke-gray-500 stroke-1 stroke-dasharray-3';
      default:
        return 'stroke-gray-400 stroke-2';
    }
  };

  const getComponentDetails = (type: string) => {
    const details = {
      application: {
        title: 'Application Server',
        description: 'Node.js application servers running the main application logic',
        specs: ['8 vCPUs', '16GB RAM', 'Auto-scaling enabled'],
      },
      'application-updated': {
        title: 'Updated Application Server',
        description: 'Application servers with dual database support and feature flag integration',
        specs: ['Database abstraction layer', 'Feature flag client', 'Enhanced monitoring'],
      },
      'load-balancer': {
        title: 'Load Balancer',
        description: 'AWS Application Load Balancer distributing traffic across instances',
        specs: ['Health checks enabled', 'SSL termination', 'Auto-scaling target'],
      },
      'database-old': {
        title: 'PostgreSQL 12 (Legacy)',
        description: 'Current production database showing performance limitations',
        specs: ['db.r5.8xlarge', '50TB storage', '100K QPS capacity'],
      },
      'database-new': {
        title: 'Aurora PostgreSQL 14',
        description: 'New high-performance database with improved architecture',
        specs: ['Serverless v2', 'Auto-scaling', '300K+ QPS capacity'],
      },
      'database-replica': {
        title: 'Read Replica (Legacy)',
        description: 'Read-only replica with 2-3 second lag',
        specs: ['db.r5.4xlarge', 'Cross-AZ', 'Read-only queries'],
      },
      'database-replica-new': {
        title: 'Aurora Read Replica',
        description: 'High-performance read replica with minimal lag',
        specs: ['Auto-scaling', '<150ms lag', 'Global read distribution'],
      },
      replication: {
        title: 'Logical Replication',
        description: 'PostgreSQL logical replication for zero-downtime migration',
        specs: ['Real-time sync', 'Data validation', 'Configurable lag alerts'],
      },
      'feature-flags': {
        title: 'Feature Flags (Redis)',
        description: 'Redis-based feature flag system for gradual migration',
        specs: ['Real-time updates', 'User-based routing', 'Rollback capability'],
      },
      monitoring: {
        title: 'Monitoring System',
        description: 'Comprehensive monitoring and alerting infrastructure',
        specs: ['Prometheus metrics', 'Grafana dashboards', 'Sentry error tracking'],
      },
      backup: {
        title: 'Aurora Backups',
        description: 'Automated backup system with point-in-time recovery',
        specs: ['Continuous backups', '35-day retention', 'Cross-region replication'],
      },
    };

    return (
      details[type as keyof typeof details] || {
        title: 'Component',
        description: 'System component',
        specs: [],
      }
    );
  };

  const currentPhase = phases[selectedPhase];

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-surface-100 rounded-lg border border-card-border">
      <h3 className="text-xl font-bold text-text-primary mb-6">Migration Architecture Evolution</h3>

      {/* Phase Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {phases.map((phase, index) => (
          <button
            type="button"
            key={`phase-${phase.title.replace(/\s+/g, '-')}`}
            onClick={() => setSelectedPhase(index)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              selectedPhase === index
                ? 'bg-accent text-white'
                : 'bg-card-bg text-text-secondary hover:bg-accent/20'
            }`}
          >
            {phase.title}
          </button>
        ))}
      </div>

      {/* Phase Description */}
      <div className="mb-6 p-4 bg-card-bg rounded-lg border border-card-border">
        <h4 className="font-semibold text-text-primary mb-2">{currentPhase.title}</h4>
        <p className="text-text-secondary">{currentPhase.description}</p>
      </div>

      {/* Architecture Diagram */}
      <div className="relative bg-white rounded-lg border border-card-border p-6 mb-6 overflow-x-auto">
        <svg width="600" height="500" className="min-w-full">
          {/* Render Connections */}
          {currentPhase.connections.map((connection, _index) => {
            const fromComponent = currentPhase.components.find((c) => c.id === connection.from);
            const toComponent = currentPhase.components.find((c) => c.id === connection.to);

            if (!fromComponent || !toComponent) return null;

            const x1 = fromComponent.x + 40; // Center of component
            const y1 = fromComponent.y + 20;
            const x2 = toComponent.x + 40;
            const y2 = toComponent.y + 20;

            return (
              <line
                key={`connection-${connection.from}-${connection.to}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={getConnectionStyle(connection.type)}
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-gray-400" />
            </marker>
          </defs>

          {/* Render Components */}
          {currentPhase.components.map((component) => (
            <foreignObject
              key={component.id}
              x={component.x}
              y={component.y}
              width="80"
              height="40"
            >
              <div
                className={getComponentStyle(component.type)}
                onClick={() => setShowDetails(component.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowDetails(component.id);
                  }
                }}
                role="button"
                tabIndex={0}
                style={{ width: '80px', height: '40px' }}
              >
                <div className="text-center leading-tight">{component.label}</div>
              </div>
            </foreignObject>
          ))}
        </svg>
      </div>

      {/* Component Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface-100 rounded-lg max-w-md">
            <div className="p-6">
              {(() => {
                const component = currentPhase.components.find((c) => c.id === showDetails);
                const details = component ? getComponentDetails(component.type) : null;

                if (!component || !details) return null;

                return (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-text-primary">{details.title}</h4>
                        <p className="text-text-secondary mt-1">{details.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDetails(null)}
                        className="text-text-secondary hover:text-text-primary text-2xl"
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-semibold text-text-primary">Specifications:</h5>
                      <ul className="space-y-1">
                        {details.specs.map((spec, index) => (
                          <li
                            key={`spec-${spec.slice(0, 15)}-${index}`}
                            className="flex items-start"
                          >
                            <div className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-text-secondary text-sm">{spec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-card-bg rounded-lg border border-card-border">
          <h5 className="font-semibold text-text-primary mb-3">Component Types:</h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
              <span>Application Servers</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
              <span>Legacy Database</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
              <span>New Aurora Database</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded mr-2"></div>
              <span>Replication</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-card-bg rounded-lg border border-card-border">
          <h5 className="font-semibold text-text-primary mb-3">Connection Types:</h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <div className="w-8 h-0.5 bg-gray-400 mr-2"></div>
              <span>Standard Connection</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-0.5 bg-yellow-500 mr-2 border-dashed"></div>
              <span>Replication Stream</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-0.5 bg-indigo-500 mr-2 border-dashed"></div>
              <span>Conditional Routing</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-0.5 bg-cyan-500 mr-2 border-dotted"></div>
              <span>Monitoring</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-text-secondary">
        Click on components to view detailed specifications
      </div>
    </div>
  );
};

export default ArchitectureDiagram;
