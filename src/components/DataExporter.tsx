
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, FileJson, Database } from "lucide-react";
import { Battery } from "@/types";

interface DataExporterProps {
  batteries: Battery[];
}

export default function DataExporter({ batteries }: DataExporterProps) {
  const [selectedBatteries, setSelectedBatteries] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [includeRawData, setIncludeRawData] = useState(false);
  const [includeAnalytics, setIncludeAnalytics] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const handleBatterySelect = (batteryId: string, checked: boolean) => {
    if (checked) {
      setSelectedBatteries(prev => [...prev, batteryId]);
    } else {
      setSelectedBatteries(prev => prev.filter(id => id !== batteryId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBatteries(batteries.map(b => b.id));
    } else {
      setSelectedBatteries([]);
    }
  };

  const exportData = () => {
    const selectedData = batteries.filter(b => selectedBatteries.includes(b.id));
    
    let exportContent = "";
    let filename = "";
    let mimeType = "";

    switch (exportFormat) {
      case "json":
        exportContent = JSON.stringify(selectedData, null, 2);
        filename = `battery-export-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = "application/json";
        break;
      
      case "xlsx":
        // For now, export as CSV with .xlsx extension
        exportContent = generateCSV(selectedData);
        filename = `battery-export-${new Date().toISOString().split('T')[0]}.xlsx`;
        mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      
      default: // csv
        exportContent = generateCSV(selectedData);
        filename = `battery-export-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = "text/csv";
        break;
    }

    // Create and download file
    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateCSV = (data: Battery[]) => {
    const headers = [
      "Battery ID",
      "Grade",
      "Status", 
      "SoH (%)",
      "RUL (cycles)",
      "Total Cycles",
      "Chemistry",
      "Upload Date",
      "Issues Count"
    ];

    if (includeAnalytics) {
      headers.push("Degradation Rate", "Efficiency Score", "Risk Level");
    }

    let csvContent = headers.join(",") + "\n";

    data.forEach(battery => {
      const row = [
        battery.id,
        battery.grade,
        battery.status,
        battery.soh.toString(),
        battery.rul.toString(),
        battery.cycles.toString(),
        battery.chemistry,
        battery.uploadDate,
        (battery.issues?.length || 0).toString()
      ];

      if (includeAnalytics) {
        const degradationRate = battery.cycles > 0 ? (100 - battery.soh) / battery.cycles : 0;
        const efficiencyScore = (battery.soh * 0.4) + (battery.rul / 50 * 0.3) + ((2000 - battery.cycles) / 20 * 0.3);
        const riskLevel = battery.soh < 80 ? "High" : battery.soh < 90 ? "Medium" : "Low";
        
        row.push(
          degradationRate.toFixed(4),
          efficiencyScore.toFixed(2),
          riskLevel
        );
      }

      csvContent += row.map(field => `"${field}"`).join(",") + "\n";
    });

    if (includeRawData) {
      csvContent += "\n\nRaw Cycle Data:\n";
      csvContent += "Battery ID,Cycle,Step,Voltage (V),Current (A),Capacity (mAh),Temperature (°C)\n";
      
      data.forEach(battery => {
        if (battery.rawData) {
          battery.rawData.forEach(dataPoint => {
            csvContent += [
              battery.id,
              dataPoint.cycle_number,
              dataPoint.step_index,
              dataPoint.voltage_V,
              dataPoint.current_A,
              dataPoint.capacity_mAh,
              dataPoint.temperature_C || ""
            ].map(field => `"${field}"`).join(",") + "\n";
          });
        }
      });
    }

    return csvContent;
  };

  const getFileIcon = () => {
    switch (exportFormat) {
      case "json": return <FileJson className="h-4 w-4" />;
      case "xlsx": return <FileSpreadsheet className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Download className="h-5 w-5 text-blue-400" />
            Data Export Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Battery Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold text-slate-300">
                Select Batteries ({selectedBatteries.length}/{batteries.length})
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedBatteries.length === batteries.length}
                  onCheckedChange={(checked) => handleSelectAll(checked === true)}
                />
                <Label htmlFor="select-all" className="text-sm text-slate-400">
                  Select All
                </Label>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
              {batteries.map(battery => (
                <div key={battery.id} className="flex items-center space-x-2 p-2 border border-white/10 rounded bg-black/20">
                  <Checkbox
                    id={battery.id}
                    checked={selectedBatteries.includes(battery.id)}
                    onCheckedChange={(checked) => handleBatterySelect(battery.id, checked === true)}
                  />
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={battery.id} className="text-xs font-medium text-white truncate block">
                      {battery.id}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {battery.grade}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold text-slate-300">Export Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                  <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                  <SelectItem value="json">JSON Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold text-slate-300">Include Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-analytics"
                    checked={includeAnalytics}
                    onCheckedChange={(checked) => setIncludeAnalytics(checked === true)}
                  />
                  <Label htmlFor="include-analytics" className="text-sm text-slate-400">
                    Analytics & Calculations
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-raw"
                    checked={includeRawData}
                    onCheckedChange={(checked) => setIncludeRawData(checked === true)}
                  />
                  <Label htmlFor="include-raw" className="text-sm text-slate-400">
                    Raw Cycle Data
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <Label className="text-base font-semibold text-slate-300 mb-3 block">Date Range Filter</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date" className="text-sm text-slate-400">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-sm text-slate-400">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Export Summary */}
          <div className="p-4 border border-blue-500/40 rounded-lg bg-blue-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Export Summary</p>
                <p className="text-xs text-slate-400">
                  {selectedBatteries.length} batteries • {exportFormat.toUpperCase()} format
                  {includeRawData && " • Raw data included"}
                  {includeAnalytics && " • Analytics included"}
                </p>
              </div>
              <Button 
                onClick={exportData} 
                disabled={selectedBatteries.length === 0}
                className="glass-button border-blue-500/40 hover:border-blue-400"
              >
                {getFileIcon()}
                <span className="ml-2">Export Data</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
