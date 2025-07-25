import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { batteryService } from '@/services/batteryService';
import { DemoService } from '@/services/demoService';
import BatteryPassportModal from '@/components/BatteryPassportModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Battery,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Zap,
  Folder,
  FolderOpen,
  Edit3,
  X,
  Move,
  Smartphone
} from 'lucide-react';
import type { Battery as BatteryType } from '@/types';

interface BatteryFolder {
  id: string;
  name: string;
  batteryIds: string[];
  createdAt: Date;
}

export default function SearchPage() {
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBattery, setSelectedBattery] = useState<BatteryType | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  
  // Folder grouping state
  const [isHapticTouchMode, setIsHapticTouchMode] = useState(false);
  const [folders, setFolders] = useState<BatteryFolder[]>([]);
  const [draggedBattery, setDraggedBattery] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [viewingFolder, setViewingFolder] = useState<BatteryFolder | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [chemistryFilter, setChemistryFilter] = useState<string>('all');
  const [sohRange, setSohRange] = useState<[number, number]>([0, 100]);
  const [sortBy, setSortBy] = useState<string>('uploadDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadBatteries();
    
    // Listen for battery data updates
    const handleBatteryUpdate = () => {
      loadBatteries();
    };
    
    window.addEventListener('batteryDataUpdated', handleBatteryUpdate);
    return () => window.removeEventListener('batteryDataUpdated', handleBatteryUpdate);
  }, [user]);

  const loadBatteries = async () => {
    try {
      setLoading(true);
      const realBatteries = await batteryService.getUserBatteries();
      setBatteries(realBatteries);
    } catch (error) {
      console.error('Error loading batteries:', error);
      toast({
        title: "Error",
        description: "Failed to load battery data",
        variant: "destructive",
      });
      setBatteries([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedBatteries = useMemo(() => {
    let filtered = batteries.filter(battery => {
      const matchesSearch = battery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (battery.name && battery.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           battery.chemistry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (battery.notes && battery.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || battery.status === statusFilter;
      const matchesGrade = gradeFilter === 'all' || battery.grade === gradeFilter;
      const matchesChemistry = chemistryFilter === 'all' || battery.chemistry === chemistryFilter;
      const matchesSoh = battery.soh >= sohRange[0] && battery.soh <= sohRange[1];
      
      return matchesSearch && matchesStatus && matchesGrade && matchesChemistry && matchesSoh;
    });

    // Sort batteries
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'soh':
          aValue = a.soh;
          bValue = b.soh;
          break;
        case 'rul':
          aValue = a.rul;
          bValue = b.rul;
          break;
        case 'cycles':
          aValue = a.cycles;
          bValue = b.cycles;
          break;
        case 'uploadDate':
        default:
          aValue = new Date(a.uploadDate);
          bValue = new Date(b.uploadDate);
          break;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [batteries, searchTerm, statusFilter, gradeFilter, chemistryFilter, sohRange, sortBy, sortOrder]);

  // Get batteries that are not in any folder
  const ungroupedBatteries = useMemo(() => {
    const folderBatteryIds = folders.flatMap(folder => folder.batteryIds);
    return filteredAndSortedBatteries.filter(battery => !folderBatteryIds.includes(battery.id));
  }, [filteredAndSortedBatteries, folders]);

  // Get batteries in a specific folder
  const getBatteriesInFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return [];
    return filteredAndSortedBatteries.filter(battery => folder.batteryIds.includes(battery.id));
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, batteryId: string) => {
    if (!isHapticTouchMode) return;
    setDraggedBattery(batteryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    if (!isHapticTouchMode || !draggedBattery) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop to create folder or add to existing folder
  const handleDrop = (e: React.DragEvent, targetBatteryId: string) => {
    if (!isHapticTouchMode || !draggedBattery || draggedBattery === targetBatteryId) return;
    e.preventDefault();

    // Check if target battery is already in a folder
    const targetFolder = folders.find(folder => folder.batteryIds.includes(targetBatteryId));
    
    if (targetFolder) {
      // Add dragged battery to existing folder
      setFolders(prev => prev.map(folder => 
        folder.id === targetFolder.id 
          ? { ...folder, batteryIds: [...folder.batteryIds, draggedBattery] }
          : folder
      ));
      toast({
        title: "Added to Folder",
        description: `Added battery to "${targetFolder.name}"`,
      });
    } else {
      // Create new folder
      const newFolder: BatteryFolder = {
        id: `folder-${Date.now()}`,
        name: `Folder ${folders.length + 1}`,
        batteryIds: [draggedBattery, targetBatteryId],
        createdAt: new Date()
      };
      setFolders(prev => [...prev, newFolder]);
      toast({
        title: "Folder Created",
        description: "Created new folder with selected batteries",
      });
    }
    
    setDraggedBattery(null);
  };

  // Handle drop on folder
  const handleFolderDrop = (e: React.DragEvent, folderId: string) => {
    if (!isHapticTouchMode || !draggedBattery) return;
    e.preventDefault();

    setFolders(prev => prev.map(folder => 
      folder.id === folderId 
        ? { ...folder, batteryIds: [...folder.batteryIds, draggedBattery] }
        : folder
    ));
    
    toast({
      title: "Added to Folder",
      description: "Battery added to folder",
    });
    
    setDraggedBattery(null);
  };

  // Remove battery from folder
  const removeBatteryFromFolder = (folderId: string, batteryId: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId 
        ? { ...folder, batteryIds: folder.batteryIds.filter(id => id !== batteryId) }
        : folder
    ));
  };

  // Delete folder
  const deleteFolder = (folderId: string) => {
    setFolders(prev => prev.filter(folder => folder.id !== folderId));
  };

  // Start editing folder name
  const startEditFolder = (folder: BatteryFolder) => {
    setEditingFolder(folder.id);
    setEditingFolderName(folder.name);
  };

  // Save folder name
  const saveFolderName = () => {
    if (editingFolder && editingFolderName.trim()) {
      setFolders(prev => prev.map(folder => 
        folder.id === editingFolder 
          ? { ...folder, name: editingFolderName.trim() }
          : folder
      ));
    }
    setEditingFolder(null);
    setEditingFolderName('');
  };

  // Cancel editing folder name
  const cancelEditFolder = () => {
    setEditingFolder(null);
    setEditingFolderName('');
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy': return 'bg-green-600/80 text-green-100';
      case 'Degrading': return 'bg-yellow-600/80 text-yellow-100';
      case 'Critical': return 'bg-red-600/80 text-red-100';
      default: return 'bg-gray-600/80 text-gray-100';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-blue-600/80 text-blue-100';
      case 'B': return 'bg-green-600/80 text-green-100';
      case 'C': return 'bg-yellow-600/80 text-yellow-100';
      case 'D': return 'bg-red-600/80 text-red-100';
      default: return 'bg-gray-600/80 text-gray-100';
    }
  };

  const handleViewBattery = (battery: BatteryType) => {
    setSelectedBattery(battery);
    setIsPassportOpen(true);
  };

  const handleSaveBattery = async (updatedBattery: BatteryType): Promise<boolean> => {
    // Check if battery can be modified
    const canModify = await batteryService.canModifyBattery(updatedBattery.id);
    if (!canModify) {
      toast({
        title: "Demo Battery",
        description: "Cannot modify demo batteries",
        variant: "destructive",
      });
      return false;
    }

    try {
      const success = await batteryService.updateBattery(updatedBattery);
      if (success) {
        setBatteries(prev => prev.map(b => b.id === updatedBattery.id ? updatedBattery : b));
        toast({
          title: "Success",
          description: "Battery updated successfully",
        });
        return true;
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update battery",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleExportResults = () => {
    const csvContent = [
      ['ID', 'Chemistry', 'Grade', 'Status', 'SoH (%)', 'RUL (cycles)', 'Cycles', 'Upload Date'].join(','),
      ...filteredAndSortedBatteries.map(battery => [
        battery.id,
        battery.chemistry,
        battery.grade,
        battery.status,
        battery.soh,
        battery.rul,
        battery.cycles,
        new Date(battery.uploadDate).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battery-search-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setGradeFilter('all');
    setChemistryFilter('all');
    setSohRange([0, 100]);
    setSortBy('uploadDate');
    setSortOrder('desc');
  };

  // Render a battery card
  const renderBatteryCard = (battery: BatteryType, isInFolder = false, folderId?: string) => (
    <Card 
      key={battery.id} 
      className={`enhanced-card hover:border-blue-500/50 transition-all ${
        isHapticTouchMode ? 'cursor-move' : ''
      } ${draggedBattery === battery.id ? 'opacity-50' : ''}`}
      draggable={isHapticTouchMode}
      onDragStart={(e) => handleDragStart(e, battery.id)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, battery.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">{battery.name || battery.id}</CardTitle>
          <Badge className={getStatusColor(battery.status)}>
            {battery.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Badge className={getGradeColor(battery.grade)}>
            Grade {battery.grade}
          </Badge>
          <Badge variant="outline" className="text-slate-300">
            {battery.chemistry}
          </Badge>
          {battery.id.startsWith('DEMO-') && (
            <Badge variant="outline" className="text-amber-300 border-amber-500/50">
              Demo
            </Badge>
          )}
          {isInFolder && (
            <Badge variant="outline" className="text-blue-300 border-blue-500/50">
              In Folder
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Battery className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-xs text-slate-400">SoH</p>
              <p className="text-white font-medium">{battery.soh.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <div>
              <p className="text-xs text-slate-400">RUL</p>
              <p className="text-white font-medium">{battery.rul.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            <div>
              <p className="text-xs text-slate-400">Cycles</p>
              <p className="text-white font-medium">{battery.cycles.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-400" />
            <div>
              <p className="text-xs text-slate-400">Uploaded</p>
              <p className="text-white font-medium text-xs">
                {new Date(battery.uploadDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Health Status</span>
            <span className="text-white">{battery.soh.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                battery.soh >= 90 ? 'bg-green-500' :
                battery.soh >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, battery.soh))}%` }}
            />
          </div>
        </div>

        {/* Issues */}
        {battery.issues && battery.issues.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-300 text-sm">
              {battery.issues.length} issue{battery.issues.length !== 1 ? 's' : ''} detected
            </span>
          </div>
        )}

        <Separator className="bg-white/10" />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => handleViewBattery(battery)}
            className="flex-1 glass-button"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          {isInFolder && folderId && (
            <Button
              onClick={() => removeBatteryFromFolder(folderId, battery.id)}
              variant="outline"
              size="sm"
              className="glass-button"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render a folder card
  const renderFolderCard = (folder: BatteryFolder) => {
    const folderBatteries = getBatteriesInFolder(folder.id);
    
    return (
      <Card 
        key={folder.id} 
        className="enhanced-card hover:border-blue-500/50 border-blue-500/30 bg-blue-900/10"
        onDragOver={handleDragOver}
        onDrop={(e) => handleFolderDrop(e, folder.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-400" />
              {editingFolder === folder.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingFolderName}
                    onChange={(e) => setEditingFolderName(e.target.value)}
                    className="h-8 text-sm glass-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveFolderName();
                      if (e.key === 'Escape') cancelEditFolder();
                    }}
                    autoFocus
                  />
                  <Button size="sm" onClick={saveFolderName} className="glass-button">
                    ✓
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditFolder} className="glass-button">
                    ✕
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white text-lg">{folder.name}</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditFolder(folder)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600/80 text-blue-100">
                {folderBatteries.length} batteries
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteFolder(folder.id)}
                className="text-red-400 hover:text-red-300 glass-button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Folder Preview */}
          <div className="grid grid-cols-2 gap-2">
            {folderBatteries.slice(0, 4).map((battery) => (
              <div key={battery.id} className="flex items-center gap-2 p-2 bg-white/5 rounded">
                <Battery className="h-3 w-3 text-blue-400" />
                <span className="text-xs text-white truncate">{battery.name || battery.id}</span>
              </div>
            ))}
            {folderBatteries.length > 4 && (
              <div className="flex items-center justify-center p-2 bg-white/5 rounded">
                <span className="text-xs text-slate-400">+{folderBatteries.length - 4} more</span>
              </div>
            )}
          </div>
          
          <Separator className="bg-white/10" />
          
          {/* Folder Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => setViewingFolder(folder)}
              className="flex-1 glass-button"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              View All ({folderBatteries.length})
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="h-32 bg-white/10 rounded"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Search & Filter</h1>
            <p className="text-slate-400">
              Find and analyze specific batteries in your fleet
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsHapticTouchMode(!isHapticTouchMode)} 
              variant={isHapticTouchMode ? "default" : "outline"} 
              className="glass-button"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              {isHapticTouchMode ? 'Exit Haptic Touch' : 'Haptic Touch Mode'}
            </Button>
            <Button onClick={handleExportResults} variant="outline" className="glass-button">
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
            <Button onClick={clearFilters} variant="outline" className="glass-button">
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Haptic Touch Mode Instructions */}
        {isHapticTouchMode && (
          <Card className="enhanced-card border-blue-500/30 bg-blue-900/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-300">
                <Move className="h-4 w-4" />
                <span className="text-sm">
                  Drag one battery card onto another to create a folder. Drag batteries onto folders to add them.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search by name, ID, chemistry, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-input"
              />
            </div>

            {/* Filter Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Healthy">Healthy</SelectItem>
                  <SelectItem value="Degrading">Degrading</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>

              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Filter by grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="A">Grade A</SelectItem>
                  <SelectItem value="B">Grade B</SelectItem>
                  <SelectItem value="C">Grade C</SelectItem>
                  <SelectItem value="D">Grade D</SelectItem>
                </SelectContent>
              </Select>

              <Select value={chemistryFilter} onValueChange={setChemistryFilter}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Filter by chemistry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chemistry</SelectItem>
                  <SelectItem value="LFP">LFP</SelectItem>
                  <SelectItem value="NMC">NMC</SelectItem>
                  <SelectItem value="NCA">NCA</SelectItem>
                  <SelectItem value="LTO">LTO</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uploadDate">Upload Date</SelectItem>
                  <SelectItem value="id">Battery ID</SelectItem>
                  <SelectItem value="soh">SoH</SelectItem>
                  <SelectItem value="rul">RUL</SelectItem>
                  <SelectItem value="cycles">Cycles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-4">
              <span className="text-slate-300 text-sm">Sort Order:</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={sortOrder === 'asc' ? 'default' : 'outline'}
                  onClick={() => setSortOrder('asc')}
                  className="glass-button"
                >
                  Ascending
                </Button>
                <Button
                  size="sm"
                  variant={sortOrder === 'desc' ? 'default' : 'outline'}
                  onClick={() => setSortOrder('desc')}
                  className="glass-button"
                >
                  Descending
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Search Results ({filteredAndSortedBatteries.length})
            {folders.length > 0 && (
              <span className="text-slate-400 ml-2">
                • {folders.length} folder{folders.length !== 1 ? 's' : ''}
              </span>
            )}
          </h2>
        </div>

        {filteredAndSortedBatteries.length === 0 ? (
          <Card className="enhanced-card">
            <CardContent className="text-center py-12">
              <Search className="h-16 w-16 mx-auto mb-4 text-slate-400 opacity-50" />
              <h3 className="text-xl font-medium text-white mb-2">No Results Found</h3>
              <p className="text-slate-400 mb-6">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <Button onClick={clearFilters} className="glass-button">
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Render Folders and their expanded content */}
            {folders.map(folder => renderFolderCard(folder))}
            
            {/* Render Ungrouped Batteries */}
            {ungroupedBatteries.map(battery => renderBatteryCard(battery))}
          </div>
        )}

        {/* Folder View Modal */}
        {viewingFolder && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setViewingFolder(null)}
            />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-6xl max-h-[90vh] bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-lg shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-6 w-6 text-blue-400" />
                  <div>
                    <h2 className="text-xl font-semibold text-white">{viewingFolder.name}</h2>
                    <p className="text-slate-400 text-sm">
                      {getBatteriesInFolder(viewingFolder.id).length} batteries
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingFolder(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {getBatteriesInFolder(viewingFolder.id).map(battery => 
                    renderBatteryCard(battery, true, viewingFolder.id)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Battery Passport Modal */}
        {selectedBattery && (
          <BatteryPassportModal
            battery={selectedBattery}
            isOpen={isPassportOpen}
            onClose={() => {
              setIsPassportOpen(false);
              setSelectedBattery(null);
            }}
            onSave={handleSaveBattery}
          />
        )}
      </div>
    </div>
  );
}
