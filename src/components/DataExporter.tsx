
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Battery } from "@/types";
import { Download, FileText, FileSpreadsheet, Database } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DataExporterProps {
  batteries: Battery[];
}

export default function DataExporter({ batteries }: DataExporterProps) {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xlsx'>('json');
  const [selectedFields, setSelectedFields] = useState<string[]>(['id', 'soh', 'rul', 'grade', 'status']);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [includeIssues, setIncludeIssues] = useState(true);

  const availableFields = [
    { id: 'id', label: 'Battery ID' },
    { id: 'grade', label: 'Grade' },
    { id: 'status', label: 'Status' },
    { id: 'soh', label: 'State of Health' },
    { id: 'rul', label: 'Remaining Useful Life' },
    { id: 'cycles', label: 'Total Cycles' },
    { id: 'chemistry', label: 'Chemistry' },
    { id: 'uploadDate', label: 'Upload Date' },
    { id: 'sohHistory', label: 'SoH History' }
  ];

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const generateReport = () => {
    const data = batteries.map(battery => {
      const exportData: any = {};
      
      selectedFields.forEach(field => {
        exportData[field] = battery[field as keyof Battery];
      });

      if (includeIssues && battery.issues) {
        exportData.issues = battery.issues.map(issue => ({
          severity: issue.severity,
          category: issue.category,
          title: issue.title,
          description: issue.description
        }));
      }

      if (includeRawData && battery.rawData) {
        exportData.rawData = battery.rawData;
      }

      return exportData;
    });

    return data;
  };

  const exportData = () => {
    const data = generateReport();
    const timestamp = new Date().toISOString().split('T')[0];

    switch (exportFormat) {
      case 'json':
        exportAsJSON(data, timestamp);
        break;
      case 'csv':
        exportAsCSV(data, timestamp);
        break;
      case 'xlsx':
        // For now, we'll export as CSV with XLSX naming
        exportAsCSV(data, timestamp, 'xlsx');
        break;
    }

    toast({
      title: "Export Complete",
      description: `Battery data exported successfully as ${exportFormat.toUpperCase()}`,
    });
  };

  const exportAsJSON = (data: any[], timestamp: string) => {
    const report = {
      exportDate: new Date().toISOString(),
      totalBatteries: batteries.length,
      exportSettings: {
        format: exportFormat,
        fields: selectedFields,
        includeRawData,
        includeIssues
      },
      data
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    downloadFile(blob, `battery-report-${timestamp}.json`);
  };

  const exportAsCSV = (data: any[], timestamp: string, extension = 'csv') => {
    if (data.length === 0) return;

    // Flatten the data for CSV
    const flattenedData = data.map(item => {
      const flattened: any = {};
      
      Object.entries(item).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          if (key === 'sohHistory') {
            // Convert SoH history to summary stats
            flattened[`${key}_points`] = value.length;
            flattened[`${key}_latest_soh`] = value[value.length - 1]?.soh || 'N/A';
          } else if (key === 'issues') {
            flattened[`${key}_count`] = value.length;
            flattened[`${key}_critical`] = value.filter((i: any) => i.severity === 'Critical').length;
          } else {
            flattened[key] = JSON.stringify(value);
          }
        } else {
          flattened[key] = value;
        }
      });
      
      return flattened;
    });

    const headers = Object.keys(flattenedData[0] || {});
    const csvContent = [
      headers.join(','),
      ...flattenedData.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadFile(blob, `battery-report-${timestamp}.${extension}`);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json': return Database;
      case 'csv': return FileSpreadsheet;
      case 'xlsx': return FileSpreadsheet;
      default: return FileText;
    }
  };

  return (
    <Card className="enhanced-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Download className="h-5 w-5 text-blue-400" />
          Data Export Center
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Format Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Export Format</label>
            <div className="grid grid-cols-3 gap-2">
              {['json', 'csv', 'xlsx'].map((format) => {
                const Icon = getFormatIcon(format);
                return (
                  <Button
                    key={format}
                    variant={exportFormat === format ? "default" : "outline"}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => setExportFormat(format as any)}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{format.toUpperCase()}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Additional Data</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-raw-data"
                  checked={includeRawData}
                  onCheckedChange={setIncludeRawData}
                />
                <label htmlFor="include-raw-data" className="text-sm text-slate-300">
                  Include Raw Cycle Data
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-issues"
                  checked={includeIssues}
                  onCheckedChange={setIncludeIssues}
                />
                <label htmlFor="include-issues" className="text-sm text-slate-300">
                  Include Issue Analysis
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Field Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300">Fields to Export</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableFields.map((field) => (
              <div key={field.id} className="flex items-center space-x-2">
                <Checkbox
                  id={field.id}
                  checked={selectedFields.includes(field.id)}
                  onCheckedChange={() => handleFieldToggle(field.id)}
                />
                <label htmlFor={field.id} className="text-sm text-slate-300">
                  {field.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Export Summary */}
        <div className="p-4 border border-white/10 rounded-lg bg-black/20">
          <h4 className="font-semibold text-white mb-2">Export Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Batteries:</span>
              <Badge variant="outline" className="ml-2 text-slate-300 border-white/20">
                {batteries.length}
              </Badge>
            </div>
            <div>
              <span className="text-slate-400">Fields:</span>
              <Badge variant="outline" className="ml-2 text-slate-300 border-white/20">
                {selectedFields.length}
              </Badge>
            </div>
            <div>
              <span className="text-slate-400">Format:</span>
              <Badge variant="outline" className="ml-2 text-slate-300 border-white/20">
                {exportFormat.toUpperCase()}
              </Badge>
            </div>
            <div>
              <span className="text-slate-400">Estimated Size:</span>
              <Badge variant="outline" className="ml-2 text-slate-300 border-white/20">
                {((batteries.length * selectedFields.length * 50 + (includeRawData ? batteries.length * 10000 : 0)) / 1024).toFixed(1)}KB
              </Badge>
            </div>
          </div>
        </div>

        <Button 
          onClick={exportData} 
          className="w-full glass-button"
          disabled={selectedFields.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Battery Data
        </Button>
      </CardContent>
    </Card>
  );
}
