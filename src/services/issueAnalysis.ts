
export interface BatteryIssue {
  id: string;
  severity: 'Critical' | 'Warning' | 'Info';
  category: 'Performance' | 'Safety' | 'Maintenance' | 'Operational';
  title: string;
  description: string;
  cause: string;
  solution: string;
  recommendation: string;
  affectedMetrics: string[];
}

export class IssueAnalysisService {
  static analyzeIssues(battery: any, rawData: any[]): BatteryIssue[] {
    const issues: BatteryIssue[] = [];

    // Analyze SoH degradation
    if (battery.soh < 80) {
      issues.push({
        id: `${battery.id}-soh-critical`,
        severity: 'Critical',
        category: 'Performance',
        title: 'Critical State of Health Degradation',
        description: `Battery SoH has dropped to ${battery.soh.toFixed(1)}%, below the 80% threshold`,
        cause: 'Excessive cycling, high temperature exposure, or deep discharge cycles may have accelerated capacity loss',
        solution: 'Consider battery replacement or capacity testing to verify actual usable capacity',
        recommendation: 'Replace battery immediately for critical applications',
        affectedMetrics: ['SoH', 'RUL', 'Capacity']
      });
    } else if (battery.soh < 90) {
      issues.push({
        id: `${battery.id}-soh-warning`,
        severity: 'Warning',
        category: 'Performance',
        title: 'Moderate State of Health Degradation',
        description: `Battery SoH is ${battery.soh.toFixed(1)}%, showing signs of aging`,
        cause: 'Normal aging process accelerated by operating conditions or usage patterns',
        solution: 'Monitor closely and implement capacity management strategies',
        recommendation: 'Plan for replacement within 6-12 months',
        affectedMetrics: ['SoH', 'RUL']
      });
    }

    // Analyze RUL
    if (battery.rul < 100) {
      issues.push({
        id: `${battery.id}-rul-critical`,
        severity: 'Critical',
        category: 'Operational',
        title: 'Low Remaining Useful Life',
        description: `Only ${battery.rul} cycles remaining before end-of-life`,
        cause: 'High degradation rate due to stress factors or poor operating conditions',
        solution: 'Immediate replacement planning and load reduction if possible',
        recommendation: 'Replace within next 50 cycles or 1-2 months',
        affectedMetrics: ['RUL', 'Reliability']
      });
    } else if (battery.rul < 300) {
      issues.push({
        id: `${battery.id}-rul-warning`,
        severity: 'Warning',
        category: 'Maintenance',
        title: 'Reduced Remaining Useful Life',
        description: `${battery.rul} cycles remaining, entering end-of-life phase`,
        cause: 'Progressive capacity fade and increased internal resistance',
        solution: 'Schedule replacement and monitor performance closely',
        recommendation: 'Plan replacement within 3-6 months',
        affectedMetrics: ['RUL', 'Performance']
      });
    }

    // Analyze cycle count
    if (battery.cycles > 2000) {
      issues.push({
        id: `${battery.id}-cycles-high`,
        severity: 'Warning',
        category: 'Maintenance',
        title: 'High Cycle Count',
        description: `Battery has completed ${battery.cycles} cycles, approaching typical lifespan limits`,
        cause: 'Extended usage leading to cumulative degradation effects',
        solution: 'Increase monitoring frequency and prepare for replacement',
        recommendation: 'Monitor weekly and plan replacement strategy',
        affectedMetrics: ['Cycles', 'Reliability']
      });
    }

    // Analyze voltage patterns from raw data
    if (rawData && rawData.length > 0) {
      const voltages = rawData.map(d => d.voltage_V).filter(v => v > 0);
      const maxVoltage = Math.max(...voltages);
      const minVoltage = Math.min(...voltages);

      if (maxVoltage > 4.3) {
        issues.push({
          id: `${battery.id}-overvoltage`,
          severity: 'Critical',
          category: 'Safety',
          title: 'Overvoltage Detected',
          description: `Maximum voltage of ${maxVoltage.toFixed(2)}V exceeds safe limits`,
          cause: 'Charging system malfunction or improper voltage settings',
          solution: 'Check charging system calibration and voltage limits',
          recommendation: 'Immediately review charging parameters',
          affectedMetrics: ['Voltage', 'Safety']
        });
      }

      if (minVoltage < 2.5) {
        issues.push({
          id: `${battery.id}-undervoltage`,
          severity: 'Critical',
          category: 'Safety',
          title: 'Deep Discharge Detected',
          description: `Minimum voltage of ${minVoltage.toFixed(2)}V indicates deep discharge`,
          cause: 'Over-discharge protection failure or excessive load',
          solution: 'Implement better discharge protection and load management',
          recommendation: 'Review discharge cutoff settings',
          affectedMetrics: ['Voltage', 'Capacity', 'Lifespan']
        });
      }

      // Check for voltage inconsistency
      const voltageStdDev = this.calculateStandardDeviation(voltages);
      if (voltageStdDev > 0.5) {
        issues.push({
          id: `${battery.id}-voltage-instability`,
          severity: 'Warning',
          category: 'Performance',
          title: 'Voltage Instability',
          description: `High voltage variation (σ=${voltageStdDev.toFixed(3)}V) detected`,
          cause: 'Internal resistance increase, connection issues, or cell imbalance',
          solution: 'Check connections and consider internal resistance testing',
          recommendation: 'Perform detailed electrical testing',
          affectedMetrics: ['Voltage', 'Performance']
        });
      }
    }

    // Chemistry-specific issues
    if (battery.chemistry === 'LFP' && battery.soh < 85) {
      issues.push({
        id: `${battery.id}-lfp-degradation`,
        severity: 'Info',
        category: 'Performance',
        title: 'LFP Chemistry Degradation Pattern',
        description: 'LFP batteries typically maintain capacity longer but show sudden drops',
        cause: 'LFP-specific degradation mechanisms including iron dissolution',
        solution: 'Consider capacity recalibration and updated SoH assessment',
        recommendation: 'Perform full capacity test to verify actual degradation',
        affectedMetrics: ['SoH', 'Capacity']
      });
    }

    if (battery.chemistry === 'NMC' && battery.cycles > 1000 && battery.soh > 90) {
      issues.push({
        id: `${battery.id}-nmc-performance`,
        severity: 'Info',
        category: 'Performance',
        title: 'Excellent NMC Performance',
        description: 'Battery showing better than expected performance for cycle count',
        cause: 'Optimal operating conditions and good thermal management',
        solution: 'Continue current operating practices',
        recommendation: 'Document and replicate successful operating conditions',
        affectedMetrics: ['Performance', 'Lifespan']
      });
    }

    return issues;
  }

  private static calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }
}
