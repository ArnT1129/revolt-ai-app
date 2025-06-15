
import { Battery } from "@/types";

export interface DashboardStatistics {
  totalBatteries: number;
  averageSoH: number;
  criticalIssues: number;
  healthyBatteries: number;
  degradingBatteries: number;
  criticalBatteries: number;
  averageRUL: number;
  totalCycles: number;
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
  chemistryDistribution: {
    LFP: number;
    NMC: number;
  };
  recentUploads: Battery[];
}

export class DashboardStatsService {
  static calculateStats(batteries: Battery[]): DashboardStatistics {
    const totalBatteries = batteries.length;
    
    // Calculate averages
    const averageSoH = totalBatteries > 0 
      ? batteries.reduce((sum, battery) => sum + battery.soh, 0) / totalBatteries 
      : 0;
    
    const averageRUL = totalBatteries > 0
      ? batteries.reduce((sum, battery) => sum + battery.rul, 0) / totalBatteries
      : 0;
    
    const totalCycles = batteries.reduce((sum, battery) => sum + battery.cycles, 0);
    
    // Count by status
    const healthyBatteries = batteries.filter(b => b.status === 'Healthy').length;
    const degradingBatteries = batteries.filter(b => b.status === 'Degrading').length;
    const criticalBatteries = batteries.filter(b => b.status === 'Critical').length;
    
    // Count critical issues across all batteries
    const criticalIssues = batteries.reduce((count, battery) => {
      return count + (battery.issues?.filter(issue => issue.severity === 'Critical').length || 0);
    }, 0);
    
    // Grade distribution
    const gradeDistribution = {
      A: batteries.filter(b => b.grade === 'A').length,
      B: batteries.filter(b => b.grade === 'B').length,
      C: batteries.filter(b => b.grade === 'C').length,
      D: batteries.filter(b => b.grade === 'D').length,
    };
    
    // Chemistry distribution
    const chemistryDistribution = {
      LFP: batteries.filter(b => b.chemistry === 'LFP').length,
      NMC: batteries.filter(b => b.chemistry === 'NMC').length,
    };
    
    // Recent uploads (last 5)
    const recentUploads = batteries
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
      .slice(0, 5);
    
    return {
      totalBatteries,
      averageSoH: Math.round(averageSoH * 10) / 10,
      criticalIssues,
      healthyBatteries,
      degradingBatteries,
      criticalBatteries,
      averageRUL: Math.round(averageRUL),
      totalCycles,
      gradeDistribution,
      chemistryDistribution,
      recentUploads
    };
  }
}
