import { Battery, BatteryGrade, BatteryStatus, BatteryIssue } from "@/types";

const MOCK_BATTERIES: Battery[] = [
  {
    id: "NMC-001A",
    grade: "A",
    status: "Healthy",
    soh: 99.1,
    rul: 1850,
    cycles: 150,
    chemistry: "NMC",
    uploadDate: new Date().toISOString().split('T')[0],
    sohHistory: [
      { cycle: 0, soh: 100 },
      { cycle: 50, soh: 99.8 },
      { cycle: 100, soh: 99.5 },
      { cycle: 150, soh: 99.1 }
    ],
    issues: [],
    notes: "New high-performance NMC battery with excellent health metrics"
  },
  {
    id: "LFP-002B",
    grade: "B",
    status: "Degrading",
    soh: 92.5,
    rul: 820,
    cycles: 1180,
    chemistry: "LFP",
    uploadDate: new Date().toISOString().split('T')[0],
    sohHistory: [
      { cycle: 0, soh: 100 },
      { cycle: 500, soh: 97.2 },
      { cycle: 1000, soh: 94.1 },
      { cycle: 1180, soh: 92.5 }
    ],
    issues: [
      {
        id: "issue-1",
        category: "Performance",
        title: "Gradual Capacity Loss",
        description: "Battery showing signs of gradual capacity degradation",
        severity: "Warning",
        cause: "Normal aging process accelerated by frequent deep cycles",
        recommendation: "Monitor closely and consider replacement planning",
        solution: "Implement gentler charging profile",
        affectedMetrics: ["soh", "rul"]
      }
    ],
    notes: "LFP battery with moderate degradation - monitor performance"
  },
  {
    id: "NMC-003C",
    grade: "C",
    status: "Critical",
    soh: 84.3,
    rul: 210,
    cycles: 2400,
    chemistry: "NMC",
    uploadDate: new Date().toISOString().split('T')[0],
    sohHistory: [
      { cycle: 0, soh: 100 },
      { cycle: 800, soh: 95.2 },
      { cycle: 1600, soh: 89.8 },
      { cycle: 2400, soh: 84.3 }
    ],
    issues: [
      {
        id: "issue-2",
        category: "Safety",
        title: "Critical SoH Level",
        description: "State of Health has dropped below safe operational threshold",
        severity: "Critical",
        cause: "Extensive cycling and aging beyond recommended limits",
        recommendation: "Replace immediately to avoid safety risks",
        solution: "Battery replacement required",
        affectedMetrics: ["soh", "rul", "cycles"]
      },
      {
        id: "issue-3",
        category: "Performance",
        title: "High Cycle Count",
        description: "Battery has exceeded recommended cycle life",
        severity: "High",
        cause: "Extended use beyond typical lifecycle",
        recommendation: "Schedule replacement and review usage patterns",
        solution: "Replacement and usage optimization",
        affectedMetrics: ["cycles"]
      }
    ],
    notes: "Critical battery requiring immediate attention and replacement"
  },
  {
    id: "LFP-004A",
    grade: "A",
    status: "Healthy",
    soh: 99.8,
    rul: 2800,
    cycles: 50,
    chemistry: "LFP",
    uploadDate: new Date().toISOString().split('T')[0],
    sohHistory: [
      { cycle: 0, soh: 100 },
      { cycle: 25, soh: 99.9 },
      { cycle: 50, soh: 99.8 }
    ],
    issues: [],
    notes: "Excellent condition LFP battery with minimal usage"
  }
];

interface BatteryUpdate {
  grade?: BatteryGrade;
  status?: BatteryStatus;
  soh?: number;
  rul?: number;
  cycles?: number;
  chemistry?: string;
  uploadDate?: string;
  sohHistory?: { cycle: number; soh: number }[];
  issues?: BatteryIssue[];
  notes?: string;
}

class BatteryService {
  async getUserBatteries(): Promise<Battery[]> {
    return new Promise((resolve) => {
      const storedBatteries = localStorage.getItem('uploadedBatteries');
      let batteries: Battery[] = storedBatteries ? JSON.parse(storedBatteries) : [];

      if (batteries.length === 0) {
        // If no batteries in local storage, initialize with mock batteries
        batteries = MOCK_BATTERIES;
        localStorage.setItem('uploadedBatteries', JSON.stringify(batteries));
      }

      setTimeout(() => {
        resolve(batteries);
      }, 500);
    });
  }

  async addBattery(newBattery: Battery): Promise<boolean> {
    return new Promise((resolve) => {
      const storedBatteries = localStorage.getItem('uploadedBatteries');
      const batteries: Battery[] = storedBatteries ? JSON.parse(storedBatteries) : [];

      // Check if the battery ID already exists
      if (batteries.find(battery => battery.id === newBattery.id)) {
        console.error('Battery with this ID already exists.');
        resolve(false);
        return;
      }

      batteries.push(newBattery);
      localStorage.setItem('uploadedBatteries', JSON.stringify(batteries));

      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  }

  async updateBattery(updatedBattery: Battery): Promise<boolean> {
    return new Promise((resolve) => {
      const storedBatteries = localStorage.getItem('uploadedBatteries');
      let batteries: Battery[] = storedBatteries ? JSON.parse(storedBatteries) : [];

      const index = batteries.findIndex(battery => battery.id === updatedBattery.id);
      if (index === -1) {
        console.error('Battery not found.');
        resolve(false);
        return;
      }

      batteries[index] = { ...batteries[index], ...updatedBattery };
      localStorage.setItem('uploadedBatteries', JSON.stringify(batteries));

      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  }

  async deleteBattery(batteryId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const storedBatteries = localStorage.getItem('uploadedBatteries');
      let batteries: Battery[] = storedBatteries ? JSON.parse(storedBatteries) : [];

      batteries = batteries.filter(battery => battery.id !== batteryId);
      localStorage.setItem('uploadedBatteries', JSON.stringify(batteries));

      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  }

  async updateBatteryFields(batteryId: string, updates: BatteryUpdate): Promise<boolean> {
    return new Promise((resolve) => {
      const storedBatteries = localStorage.getItem('uploadedBatteries');
      let batteries: Battery[] = storedBatteries ? JSON.parse(storedBatteries) : [];

      const index = batteries.findIndex(battery => battery.id === batteryId);
      if (index === -1) {
        console.error('Battery not found.');
        resolve(false);
        return;
      }

      batteries[index] = { ...batteries[index], ...updates };
      localStorage.setItem('uploadedBatteries', JSON.stringify(batteries));

      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  }
}

export const batteryService = new BatteryService();
