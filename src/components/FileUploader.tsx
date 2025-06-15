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
    setError(null); // Clear any previous errors when a new file is dropped
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setError(null); // Clear any previous errors when a new file is selected
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setIsLoading(true);
    setError(null); // Clear any previous errors

    try {
      const { data, metadata } = await BatteryDataParser.parseFile(file);
      setParsedData(data);
      setMetadata(metadata);
      const battery = analyzeBatteryData(data, metadata);
      setBatteryAnalysis(battery);

      // Store the uploaded battery data in local storage
      const uploadedBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
      uploadedBatteries.push(battery);
      localStorage.setItem('uploadedBatteries', JSON.stringify(uploadedBatteries));

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
      soh: Math.round(currentSoH * 10) / 10, // Round to 1 decimal place
      rul,
      cycles: totalCycles,
      chemistry: metadata.chemistry === 'LFP' ? 'LFP' : 'NMC',
      uploadDate: new Date().toLocaleDateString(),
      sohHistory: sohHistory.map(point => ({
        ...point,
        soh: Math.round(point.soh * 10) / 10 // Round to 1 decimal place
      }))
    };

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
    // Update the battery in local storage
    const uploadedBatteries = JSON.parse(localStorage.getItem('uploadedBatteries') || '[]');
    const updatedBatteries = uploadedBatteries.map((battery: Battery) =>
      battery.id === updatedBattery.id ? updatedBattery : battery
    );
    localStorage.setItem('uploadedBatteries', JSON.stringify(updatedBatteries));

    // Update the local state
    setBatteryAnalysis(updatedBattery);
    setIsModalOpen(false);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Upload Battery Data</CardTitle>
          <CardDescription>
            Upload a CSV or XLSX file containing battery cycle data to analyze its health and performance.
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
