import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Plus, 
  X, 
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  FileImage,
  FileCode,
  FileSpreadsheet,
  FileArchive
} from 'lucide-react';
import { BatteryAttachment } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface BatteryFileAttachmentsProps {
  attachments: BatteryAttachment[];
  onAttachmentsChange: (attachments: BatteryAttachment[]) => void;
  maxFiles?: number;
}

const attachmentTypes = [
  { value: 'pcb_design', label: 'PCB Design', icon: FileCode },
  { value: 'chemistry_spec', label: 'Chemistry Spec', icon: FileText },
  { value: 'design_spec', label: 'Design Spec', icon: FileText },
  { value: 'test_report', label: 'Test Report', icon: FileSpreadsheet },
  { value: 'manufacturing_data', label: 'Manufacturing Data', icon: FileSpreadsheet },
  { value: 'safety_data', label: 'Safety Data', icon: FileText },
  { value: 'thermal_analysis', label: 'Thermal Analysis', icon: FileImage },
  { value: 'other', label: 'Other', icon: FileArchive }
];

export default function BatteryFileAttachments({ 
  attachments, 
  onAttachmentsChange, 
  maxFiles = 5 
}: BatteryFileAttachmentsProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    name: '',
    type: 'other' as BatteryAttachment['type'],
    description: '',
    tags: ''
  });
  const [previewAttachment, setPreviewAttachment] = useState<BatteryAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadData(prev => ({
        ...prev,
        name: file.name.replace(/\.[^/.]+$/, '') // Remove extension for name
      }));
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !uploadData.name.trim()) {
      toast({
        title: "Upload Error",
        description: "Please select a file and provide a name",
        variant: "destructive"
      });
      return;
    }

    if (attachments.length >= maxFiles) {
      toast({
        title: "Upload Error",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      });
      return;
    }

    const newAttachment: BatteryAttachment = {
      id: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: uploadData.name.trim(),
      type: uploadData.type,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      uploadDate: new Date(),
      description: uploadData.description.trim() || undefined,
      tags: uploadData.tags.trim() ? uploadData.tags.split(',').map(tag => tag.trim()) : undefined,
      metadata: {
        originalName: selectedFile.name,
        mimeType: selectedFile.type,
        lastModified: selectedFile.lastModified
      }
    };

    onAttachmentsChange([...attachments, newAttachment]);
    
    // Reset form
    setSelectedFile(null);
    setUploadData({
      name: '',
      type: 'other',
      description: '',
      tags: ''
    });
    setIsUploadModalOpen(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast({
      title: "File Uploaded",
      description: `${newAttachment.name} has been added to the battery passport`,
    });
  };

  const handleDelete = (attachmentId: string) => {
    const updatedAttachments = attachments.filter(att => att.id !== attachmentId);
    onAttachmentsChange(updatedAttachments);
    
    toast({
      title: "File Removed",
      description: "File has been removed from the battery passport",
    });
  };

  const getFileIcon = (type: BatteryAttachment['type']) => {
    switch (type) {
      case 'pcb_design':
        return <FileCode className="h-5 w-5 text-blue-400" />;
      case 'chemistry_spec':
      case 'design_spec':
      case 'safety_data':
        return <FileText className="h-5 w-5 text-green-400" />;
      case 'test_report':
      case 'manufacturing_data':
        return <FileSpreadsheet className="h-5 w-5 text-orange-400" />;
      case 'thermal_analysis':
        return <FileImage className="h-5 w-5 text-purple-400" />;
      default:
        return <FileArchive className="h-5 w-5 text-slate-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeLabel = (type: BatteryAttachment['type']) => {
    return attachmentTypes.find(t => t.value === type)?.label || 'Other';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-medium text-white">Attachments</h3>
          <Badge variant="outline" className="text-xs">
            {attachments.length}/{maxFiles}
          </Badge>
        </div>
        
        {attachments.length < maxFiles && (
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add File
          </Button>
        )}
      </div>

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <Card className="enhanced-card">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">No Attachments</h4>
            <p className="text-slate-400 mb-4">
              Add files to provide additional context for this battery passport
            </p>
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload First File
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="enhanced-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(attachment.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium truncate">{attachment.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(attachment.type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {attachment.fileName}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(attachment.fileSize)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {attachment.uploadDate.toLocaleDateString()}
                        </span>
                      </div>
                      {attachment.description && (
                        <p className="text-slate-300 text-sm mt-2">{attachment.description}</p>
                      )}
                      {attachment.tags && attachment.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {attachment.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewAttachment(attachment)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Simulate download
                        toast({
                          title: "Download Started",
                          description: `Downloading ${attachment.fileName}`,
                        });
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(attachment.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-400" />
              Upload File
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File Selection */}
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-slate-300">Select File</Label>
              <input
                ref={fileInputRef}
                type="file"
                id="file-upload"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.sch,.brd,.kicad_pcb,.pcb,.lay,.txt,.doc,.docx,.xls,.xlsx,.zip,.rar"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </div>
              )}
            </div>

            {/* File Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="attachment-name" className="text-slate-300">Display Name</Label>
                <Input
                  id="attachment-name"
                  value={uploadData.name}
                  onChange={(e) => setUploadData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter a display name for the file"
                  className="glass-button"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachment-type" className="text-slate-300">File Type</Label>
                <Select value={uploadData.type} onValueChange={(value) => setUploadData(prev => ({ ...prev, type: value as BatteryAttachment['type'] }))}>
                  <SelectTrigger className="glass-button">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {attachmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachment-description" className="text-slate-300">Description (Optional)</Label>
                <Textarea
                  id="attachment-description"
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the file content"
                  className="glass-button"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachment-tags" className="text-slate-300">Tags (Optional)</Label>
                <Input
                  id="attachment-tags"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Enter tags separated by commas"
                  className="glass-button"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || !uploadData.name.trim()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewAttachment} onOpenChange={() => setPreviewAttachment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {previewAttachment && getFileIcon(previewAttachment.type)}
              {previewAttachment?.name}
            </DialogTitle>
          </DialogHeader>
          
          {previewAttachment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">File Name:</span>
                  <div className="text-white font-medium">{previewAttachment.fileName}</div>
                </div>
                <div>
                  <span className="text-slate-400">File Size:</span>
                  <div className="text-white font-medium">{formatFileSize(previewAttachment.fileSize)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Type:</span>
                  <div className="text-white font-medium">{getTypeLabel(previewAttachment.type)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Upload Date:</span>
                  <div className="text-white font-medium">{previewAttachment.uploadDate.toLocaleDateString()}</div>
                </div>
              </div>
              
              {previewAttachment.description && (
                <div>
                  <span className="text-slate-400 text-sm">Description:</span>
                  <div className="text-white text-sm mt-1">{previewAttachment.description}</div>
                </div>
              )}
              
              {previewAttachment.tags && previewAttachment.tags.length > 0 && (
                <div>
                  <span className="text-slate-400 text-sm">Tags:</span>
                  <div className="flex gap-1 mt-1">
                    {previewAttachment.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Download Started",
                      description: `Downloading ${previewAttachment.fileName}`,
                    });
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={() => setPreviewAttachment(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 