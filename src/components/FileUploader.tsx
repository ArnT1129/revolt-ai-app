
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Battery } from "@/types";
import { BatteryDataParser } from "@/services/batteryDataParser";
import BatteryPassportModal from "@/components/BatteryPassportModal";
import { batteryAnalytics } from "@/services/batteryAnalytics";

export default function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [batteryAnalysis, setBatteryAnalysis] = useState<Battery | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setFile(file);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setError(null);
    }
  };

  const applyDataProcessingSettings = (data: any[]): any[] => {
    const settings = (window as any).batteryAnalysisSettings;
    if (!settings) return data;

    let processedData = [...data];

    // Apply outlier removal
    if (settings.outlierRemoval) {
      processedData = removeOutliers(processedData);
    }

    // Apply data smoothing
    if (settings.smoothingEnabled) {
      processedData = applySmoothingFilter(processedData);
    }

    return processedData;
  };

  const removeOutliers = (data: any[]): any[] => {
    // Simple outlier removal using IQR method for voltage and current
    const voltages = data.map(d => d.voltage_V).filter(v => v != null);
    const currents = data.map(d => d.current_A).filter(c => c != null);

    const getIQRBounds = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      return {
        lower: q1 - 1.5 * iqr,
        upper: q3 + 1.5 * iqr
      };
    };

    const voltageBounds = getIQRBounds(voltages);
    const currentBounds = getIQRBounds(currents);

    return data.filter(d => {
      const voltageOk = d.voltage_V >= voltageBounds.lower && d.voltage_V <= voltageBounds.upper;
      const currentOk = d.current_A >= currentBounds.lower && d.current_A <= currentBounds.upper;
      return voltageOk && currentOk;
    });
  };

  const applySmoothingFilter = (data: any[]): any[] => {
    // Simple moving average smoothing for voltage and current
    const windowSize = 5;
    const smoothed = [...data];

    for (let i = windowSize; i < data.length - windowSize; i++) {
      const voltageWindow = data.slice(i - windowSize, i + windowSize + 1).map(d => d.voltage_V);
      const currentWindow = data.slice(i - windowSize, i + windowSize + 1).map(d => d.current_A);
      
      smoothed[i].voltage_V = voltageWindow.reduce((a, b) => a + b, 0) / voltageWindow.length;
      smoothed[i].current_A = currentWindow.reduce((a, b) => a + b, 0) / currentWindow.length;
    }

    return smoothed;
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, metadata } = await BatteryDataParser.parseFile(file);
      
      // Apply data processing settings
      const processedData = applyDataProcessingSettings(data);
      
      setParsedData(processedData);
      setMetadata(metadata);
      const battery = analyzeBatteryData(processedData, metadata);
      setBatteryAnalysis(battery);

      // Store the uploaded battery data in local storage
      const uploadedBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
      uploadedBatteries.push(battery);
      localStorage.setItem('uploadedBatteries', JSON.stringify(uploadedBatteries));

      // Trigger dashboard update
      window.dispatchEvent(new CustomEvent('batteryDataUpdated'));

      // Auto-open passport for manual editing
      setIsModalOpen(true);

    } catch (e: any) {
      console.error("Upload Error:", e);
      setError(e.message || "An error occurred during file processing.");
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeBatteryData = (parsedData: any[], metadata: any): Battery => {
    console.log('Analyzing battery data with', parsedData.length, 'data points');
    
    // Use analytics service for accurate calculations
    const sohHistory = batteryAnalytics.generateSoHHistory(parsedData);
    const currentSoH = batteryAnalytics.calculateSoH(parsedData);
    const degradationRate = batteryAnalytics.calculateDegradationRate(sohHistory);
    const rul = batteryAnalytics.calculateRUL(sohHistory, currentSoH);
    const totalCycles = metadata.totalCycles || Math.max(...parsedData.map(d => d.cycle_number));
    const grade = batteryAnalytics.calculateGrade(currentSoH, rul, totalCycles);
    const status = batteryAnalytics.calculateStatus(currentSoH, degradationRate);

    const battery: Battery = {
      id: `BAT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      grade,
      status,
      soh: Math.round(currentSoH * 10) / 10,
      rul,
      cycles: totalCycles,
      chemistry: metadata.chemistry === 'LFP' ? 'LFP' : 'NMC',
      uploadDate: new Date().toLocaleDateString(),
      sohHistory: sohHistory.map(point => ({
        ...point,
        soh: Math.round(point.soh * 10) / 10
      })),
      rawData: parsedData
    };

    // Analyze issues and calculate advanced metrics
    battery.issues = batteryAnalytics.analyzeIssues(battery, parsedData);
    battery.metrics = batteryAnalytics.calculateAdvancedMetrics(battery, parsedData);

    console.log('Generated battery analysis:', battery);
    return battery;
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveBattery = (updatedBattery: Battery) => {
    const uploadedBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
    const updatedBatteries = uploadedBatteries.map((battery: Battery) =>
      battery.id === updatedBattery.id ? updatedBattery : battery
    );
    localStorage.setItem('uploadedBatteries', JSON.stringify(updatedBatteries));

    setBatteryAnalysis(updatedBattery);
    setIsModalOpen(false);
    
    window.dispatchEvent(new CustomEvent('batteryDataUpdated'));
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Upload Battery Data</CardTitle>
          <CardDescription>
            Upload a CSV or XLSX file containing battery cycle data to analyze its health and performance.
            Files of any size are supported.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* File Uploader */}
            <div {...getRootProps()} className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-md cursor-pointer">
              <input {...getInputProps()} onChange={handleFileChange} />
              {isDragActive ? (
                <p className="text-center">Drop the files here ...</p>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Select a file or drag and drop here</p>
                  <p className="text-xs text-muted-foreground mt-1">No size limit - any file size supported</p>
                </div>
              )}
            </div>

            {/* Selected File */}
            {file && (
              <div className="flex items-center space-x-4">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Selected File:</p>
                  <p className="text-sm text-muted-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Upload Button */}
            <Button onClick={handleUpload} disabled={isLoading}>
              {isLoading ? "Analyzing..." : "Analyze Battery Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Battery Analysis Result */}
      {batteryAnalysis && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Battery Analysis Result</CardTitle>
              <CardDescription>
                Here are the key metrics and insights derived from the uploaded battery data.
                <Button onClick={handleOpenModal} size="sm" className="ml-2">View Passport</Button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Battery ID</Label>
                  <Input type="text" value={batteryAnalysis.id} readOnly />
                </div>
                <div>
                  <Label>Grade</Label>
                  <Input type="text" value={batteryAnalysis.grade} readOnly />
                </div>
                <div>
                  <Label>State of Health (SoH)</Label>
                  <Input type="text" value={`${batteryAnalysis.soh}%`} readOnly />
                </div>
                <div>
                  <Label>Remaining Useful Life (RUL)</Label>
                  <Input type="text" value={batteryAnalysis.rul} readOnly />
                </div>
                <div>
                  <Label>Total Cycles</Label>
                  <Input type="text" value={batteryAnalysis.cycles} readOnly />
                </div>
                <div>
                  <Label>Chemistry</Label>
                  <Input type="text" value={batteryAnalysis.chemistry} readOnly />
                </div>
              </div>
              
              {batteryAnalysis.issues && batteryAnalysis.issues.length > 0 && (
                <div className="mt-4">
                  <Label className="text-base font-semibold">Issues Detected: {batteryAnalysis.issues.length}</Label>
                  <div className="grid gap-2 mt-2">
                    {batteryAnalysis.issues.slice(0, 3).map((issue) => (
                      <Alert key={issue.id} variant={issue.severity === 'Critical' ? 'destructive' : 'default'}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{issue.title}</AlertTitle>
                        <AlertDescription>{issue.description}</AlertDescription>
                      </Alert>
                    ))}
                    {batteryAnalysis.issues.length > 3 && (
                      <p className="text-sm text-muted-foreground">
                        +{batteryAnalysis.issues.length - 3} more issues. View full details in Battery Passport.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Battery Passport Modal */}
      {batteryAnalysis && (
        <BatteryPassportModal
          battery={batteryAnalysis}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveBattery}
        />
      )}
    </div>
  );
}
