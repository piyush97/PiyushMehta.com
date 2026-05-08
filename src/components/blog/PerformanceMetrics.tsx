import React, { useState } from 'react';

interface MetricData {
  macos: number;
  arch: number;
}

interface PerformanceData {
  bootTime: MetricData;
  memoryUsage: MetricData;
  dockerBuild: MetricData;
  ideStartup: MetricData;
  fileSearch: MetricData;
}

interface PerformanceMetricsProps {
  data: PerformanceData;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState<keyof PerformanceData>('dockerBuild');

  const metrics = [
    {
      key: 'bootTime' as keyof PerformanceData,
      label: 'Boot Time',
      unit: 'seconds',
      description: 'Time from power on to desktop',
      lowerIsBetter: true,
    },
    {
      key: 'memoryUsage' as keyof PerformanceData,
      label: 'Memory Usage',
      unit: 'GB',
      description: 'Idle system memory consumption',
      lowerIsBetter: true,
    },
    {
      key: 'dockerBuild' as keyof PerformanceData,
      label: 'Docker Build',
      unit: 'seconds',
      description: 'Average build time for medium project',
      lowerIsBetter: true,
    },
    {
      key: 'ideStartup' as keyof PerformanceData,
      label: 'IDE Startup',
      unit: 'seconds',
      description: 'VS Code with extensions loaded',
      lowerIsBetter: true,
    },
    {
      key: 'fileSearch' as keyof PerformanceData,
      label: 'File Search',
      unit: 'seconds',
      description: 'Find files in large project',
      lowerIsBetter: true,
    },
  ];

  const calculateImprovement = (macos: number, arch: number, lowerIsBetter: boolean) => {
    if (lowerIsBetter) {
      return Math.round(((macos - arch) / macos) * 100);
    } else {
      return Math.round(((arch - macos) / macos) * 100);
    }
  };

  const getBarWidth = (value: number, max: number) => {
    return Math.max((value / max) * 100, 5); // Minimum 5% width for visibility
  };

  const selectedMetricData = metrics.find((m) => m.key === selectedMetric)!;
  const macosValue = data[selectedMetric].macos;
  const archValue = data[selectedMetric].arch;
  const improvement = calculateImprovement(macosValue, archValue, selectedMetricData.lowerIsBetter);
  const maxValue = Math.max(macosValue, archValue);

  return (
    <div className="not-prose bg-surface-2 border border-border rounded-xl p-6 my-8">
      <h3 className="text-xl font-semibold text-text-primary mb-6">
        Performance Comparison: Real World Metrics
      </h3>

      {/* Metric Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {metrics.map((metric) => (
          <button
            type="button"
            key={metric.key}
            onClick={() => setSelectedMetric(metric.key)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedMetric === metric.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-3 text-text-secondary hover:text-text-primary hover:bg-surface-1'
            }`}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {/* Selected Metric Visualization */}
      <div className="bg-surface-1 border border-border rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-text-primary mb-1">
            {selectedMetricData.label}
          </h4>
          <p className="text-text-secondary text-sm">{selectedMetricData.description}</p>
        </div>

        <div className="space-y-4">
          {/* macOS Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-text-primary font-medium">macOS</span>
              <span className="font-mono text-text-primary">
                {macosValue} {selectedMetricData.unit}
              </span>
            </div>
            <div className="bg-surface-3 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-1000 ease-out"
                style={{ width: `${getBarWidth(macosValue, maxValue)}%` }}
              />
            </div>
          </div>

          {/* Arch Linux Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-text-primary font-medium">Arch Linux</span>
              <span className="font-mono text-text-primary">
                {archValue} {selectedMetricData.unit}
              </span>
            </div>
            <div className="bg-surface-3 rounded-full h-3 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-1000 ease-out"
                style={{ width: `${getBarWidth(archValue, maxValue)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Improvement Badge */}
        <div className="mt-4 text-center">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              improvement > 0
                ? 'bg-green-500/10 border border-green-500/20'
                : 'bg-red-500/10 border border-red-500/20'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${improvement > 0 ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span
              className={`font-semibold ${improvement > 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {improvement > 0 ? '+' : ''}
              {improvement}% improvement
            </span>
          </div>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
        {metrics.map((metric) => {
          const metricImprovement = calculateImprovement(
            data[metric.key].macos,
            data[metric.key].arch,
            metric.lowerIsBetter
          );

          return (
            <div
              key={metric.key}
              className={`bg-surface-1 border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedMetric === metric.key
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedMetric(metric.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedMetric(metric.key);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Select ${metric.label} metric`}
            >
              <div className="text-center">
                <div className="text-sm text-text-secondary mb-1">{metric.label}</div>
                <div
                  className={`text-lg font-bold ${
                    metricImprovement > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {metricImprovement > 0 ? '+' : ''}
                  {metricImprovement}%
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {data[metric.key].arch} {metric.unit}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-sm text-text-secondary bg-surface-1 border border-border rounded-lg p-4">
        <h5 className="font-medium text-text-primary mb-2">Methodology</h5>
        <p>
          All benchmarks were performed on identical hardware (Intel NUC13ANKi7) with the same
          applications and workloads. Tests were averaged over 10 runs with system caches cleared
          between tests. macOS version: 14.6, Arch Linux with Zen kernel 6.16.3.
        </p>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
