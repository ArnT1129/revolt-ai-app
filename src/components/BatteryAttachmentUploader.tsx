import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  X, 
  Download, 
  Eye, 
  Trash2, 
  Plus,
  CircuitBoard,
  Beaker,
  FileSpreadsheet,
  TestTube,
  Shield,
  Thermometer,
  Settings,
  Database,
  File,
  Tag
} from 'lucide-react';
import { BatteryAttachment } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface BatteryAttachmentUploaderProps {
  attachments?: BatteryAttachment[];
  onAttachmentsChange: (attachments: BatteryAttachment[]) => void;
}

export default function BatteryAttachmentUploader({ 
  attachments = [], 
  onAttachmentsChange 
}: BatteryAttachmentUploaderProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<BatteryAttachment['type']>('other');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const { toast } = useToast();

  const attachmentTypeOptions = [
    { value: 'pcb_design', label: 'PCB Design', icon: CircuitBoard, color: 'text-blue-400' },
    { value: 'chemistry_spec', label: 'Chemistry Spec', icon: Beaker, color: 'text-green-400' },
    { value: 'design_spec', label: 'Design Spec', icon: FileSpreadsheet, color: 'text-purple-400' },
    { value: 'test_report', label: 'Test Report', icon: TestTube, color: 'text-orange-400' },
    { value: 'manufacturing_data', label: 'Manufacturing Data', icon: Database, color: 'text-cyan-400' },
    { value: 'safety_data', label: 'Safety Data', icon: Shield, color: 'text-red-400' },
    { value: 'thermal_analysis', label: 'Thermal Analysis', icon: Thermometer, color: 'text-pink-400' },
    { value: 'other', label: 'Other', icon: File, color: 'text-gray-400' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    const newAttachment: BatteryAttachment = {
      id: `att_${Date.now()}`,
      name: selectedFile.name,
      type: attachmentType,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      uploadDate: new Date(),
      description: description || undefined,
      tags: tags.length > 0 ? tags : undefined
    };

    onAttachmentsChange([...attachments, newAttachment]);
    
    // Reset form
    setSelectedFile(null);
    setAttachmentType('other');
    setDescription('');
    setTags([]);
    setShowUploadDialog(false);

    toast({
      title: "File Uploaded",
      description: `${selectedFile.name} has been attached to the battery passport`,
    });
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    const updatedAttachments = attachments.filter(att => att.id !== attachmentId);
    onAttachmentsChange(updatedAttachments);
    
    toast({
      title: "Attachment Removed",
      description: "File has been removed from the battery passport",
    });
  };

  const getAttachmentIcon = (type: BatteryAttachment['type']) => {
    const option = attachmentTypeOptions.find(opt => opt.value === type);
    return option ? <option.icon className={`h-4 w-4 ${option.color}`} /> : <File className="h-4 w-4 text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Battery Attachments</h3>
          <p className="text-slate-400 text-sm">
            Upload PCB designs, chemistry specs, and other relevant files
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add File
        </Button>
      </div>

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <Card className="enhanced-card">
          <CardContent className="p-6 text-center">
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No attachments yet</p>
            <p className="text-slate-500 text-sm">
              Upload PCB designs, chemistry specifications, or other relevant files
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="enhanced-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800/40">
                      {getAttachmentIcon(attachment.type)}
                    </div>
                    <div>
                      <CardTitle className="text-white text-sm">{attachment.name}</CardTitle>
                      <p className="text-slate-400 text-xs">
                        {formatFileSize(attachment.fileSize)} • {attachment.uploadDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {attachmentTypeOptions.find(opt => opt.value === attachment.type)?.label}
                    </Badge>
                    {attachment.description && (
                      <span className="text-slate-300 text-xs">{attachment.description}</span>
                    )}
                  </div>
                  
                  {attachment.tags && attachment.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {attachment.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Upload Attachment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File Selection */}
            <div>
              <label className="text-sm text-slate-300 mb-2 block">File</label>
              <input
                type="file"
                onChange={handleFileSelect}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                accept=".pdf,.png,.jpg,.jpeg,.sch,.brd,.kicad_pcb,.pcb,.lay,.xlsx,.xls,.doc,.docx,.txt"
              />
              {selectedFile && (
                <p className="text-xs text-slate-400 mt-1">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            {/* Attachment Type */}
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Type</label>
              <select
                value={attachmentType}
                onChange={(e) => setAttachmentType(e.target.value as BatteryAttachment['type'])}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                {attachmentTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                rows={3}
                placeholder="Describe the file content..."
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Tags (Optional)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded text-white"
                  placeholder="Add a tag..."
                />
                <Button onClick={handleAddTag} size="sm">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 