
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { batteryService } from '@/services/batteryService';
import { Battery } from '@/types';
import { AlertTriangle, MessageCircle, Search, Filter, Eye, Clock, User, Flag, FileText } from 'lucide-react';

interface ReviewItem {
  id: string;
  battery_id: string;
  battery: Battery;
  marked_by: string;
  marked_by_name: string;
  marked_at: string;
  review_type: 'individual' | 'company';
  notes?: string;
}

export default function Review() {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ReviewItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState<string>('all'); // 'all', 'mine', 'company'
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isCompanyMode, currentCompany } = useCompany();

  useEffect(() => {
    fetchReviewItems();
  }, [isCompanyMode]);

  useEffect(() => {
    filterItems();
  }, [reviewItems, searchTerm, viewFilter]);

  const fetchReviewItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get all batteries marked for review
      const batteries = await batteryService.getUserBatteries();
      const reviewItems: ReviewItem[] = [];

      for (const battery of batteries) {
        if (battery.notes && battery.notes.includes('[MARKED FOR REVIEW')) {
          // Parse review information from notes
          const reviewMatch = battery.notes.match(/\[MARKED FOR REVIEW by (.+?) on (.+?)\]/);
          if (reviewMatch) {
            const markedBy = reviewMatch[1];
            const markedAt = reviewMatch[2];
            
            reviewItems.push({
              id: `review-${battery.id}`,
              battery_id: battery.id,
              battery: battery,
              marked_by: markedBy.includes('@') ? markedBy : user.id,
              marked_by_name: markedBy,
              marked_at: markedAt,
              review_type: isCompanyMode ? 'company' : 'individual',
              notes: battery.notes
            });
          }
        }
      }

      setReviewItems(reviewItems);
    } catch (error) {
      console.error('Error fetching review items:', error);
      // Create mock data for demo
      const mockItems: ReviewItem[] = [
        {
          id: 'review-demo-001',
          battery_id: 'DEMO-NMC-001',
          battery: {
            id: 'DEMO-NMC-001',
            grade: 'A',
            status: 'Healthy',
            soh: 98.5,
            rul: 2100,
            cycles: 200,
            chemistry: 'NMC',
            uploadDate: new Date().toISOString().split('T')[0],
            sohHistory: [],
            issues: []
          },
          marked_by: 'demo-user',
          marked_by_name: 'Demo User',
          marked_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          review_type: isCompanyMode ? 'company' : 'individual',
          notes: 'Battery showing excellent performance metrics. Marked for quality review.'
        }
      ];
      setReviewItems(mockItems);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = async () => {
    let filtered = [...reviewItems];
    const { data: { user } } = await supabase.auth.getUser();

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.battery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.marked_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.battery.chemistry.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (viewFilter === 'mine' && user) {
      filtered = filtered.filter(item => item.marked_by === user.email || item.marked_by === user.id);
    } else if (viewFilter === 'company' && isCompanyMode) {
      filtered = filtered.filter(item => item.review_type === 'company');
    }

    setFilteredItems(filtered);
  };

  const removeFromReview = async (reviewId: string) => {
    try {
      const item = reviewItems.find(i => i.id === reviewId);
      if (!item) return;

      // Remove the review flag from the battery notes
      const updatedNotes = item.battery.notes?.replace(/\[MARKED FOR REVIEW[^\]]*\]/g, '').trim() || '';
      const updatedBattery = { ...item.battery, notes: updatedNotes };

      const success = await batteryService.updateBattery(updatedBattery);
      if (success) {
        setReviewItems(prev => prev.filter(i => i.id !== reviewId));
        toast({
          title: "Success",
          description: "Battery removed from review list",
        });
      }
    } catch (error) {
      console.error('Error removing from review:', error);
      toast({
        title: "Error",
        description: "Failed to remove battery from review",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy': return 'bg-green-600/80 text-green-100 border-green-600/50';
      case 'Degrading': return 'bg-yellow-600/80 text-yellow-100 border-yellow-600/50';
      case 'Critical': return 'bg-red-600/80 text-red-100 border-red-600/50';
      default: return 'bg-gray-600/80 text-gray-100 border-gray-600/50';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-600/80 text-green-100 border-green-600/50';
      case 'B': return 'bg-blue-600/80 text-blue-100 border-blue-600/50';
      case 'C': return 'bg-yellow-600/80 text-yellow-100 border-yellow-600/50';
      case 'D': return 'bg-red-600/80 text-red-100 border-red-600/50';
      default: return 'bg-gray-600/80 text-gray-100 border-gray-600/50';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading review items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Flag className="h-6 w-6 text-orange-400" />
            Battery Review Queue
            {filteredItems.length > 0 && (
              <Badge className="bg-orange-600/80 text-orange-100 border-0 ml-2">
                {filteredItems.length} items
              </Badge>
            )}
          </h1>
          <p className="text-slate-400">
            {isCompanyMode 
              ? 'Review battery passports marked by your team' 
              : 'Review battery passports you have marked'
            }
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="enhanced-card">
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search review items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input pl-10"
                />
              </div>
            </div>
            <Select value={viewFilter} onValueChange={setViewFilter}>
              <SelectTrigger className="w-48 glass-input">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="mine">My Reviews</SelectItem>
                {isCompanyMode && (
                  <SelectItem value="company">Company Reviews</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Review Items List */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-white">Review Items ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Flag className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No items for review</p>
                <p className="text-sm">
                  {viewFilter === 'mine' 
                    ? 'You haven\'t marked any batteries for review yet'
                    : 'No battery passports are currently marked for review'
                  }
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 rounded-lg border bg-slate-800/40 border-slate-600/30 hover:bg-slate-700/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        <FileText className="h-5 w-5 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-orange-600/80 text-orange-100 border-0">
                            FOR REVIEW
                          </Badge>
                          <Badge className={`text-xs px-2 py-1 ${getStatusColor(item.battery.status)}`}>
                            {item.battery.status}
                          </Badge>
                          <Badge className={`text-xs px-2 py-1 ${getGradeColor(item.battery.grade)}`}>
                            Grade {item.battery.grade}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {item.battery.chemistry}
                          </span>
                        </div>
                        <h3 className="font-semibold text-white mb-2">
                          Battery {item.battery.id}
                        </h3>
                        <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                          <div>
                            <span className="text-slate-400">SoH:</span>
                            <span className="text-green-300 font-medium ml-2">
                              {item.battery.soh.toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">RUL:</span>
                            <span className="text-blue-300 font-medium ml-2">
                              {item.battery.rul}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Cycles:</span>
                            <span className="text-purple-300 font-medium ml-2">
                              {item.battery.cycles.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Marked by: {item.marked_by_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(item.marked_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="glass-button"
                            onClick={() => setSelectedItem(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="enhanced-card max-w-4xl">
                          <DialogHeader>
                            <DialogTitle className="text-white flex items-center gap-2">
                              <FileText className="h-5 w-5 text-orange-400" />
                              Review Details - {selectedItem?.battery.id}
                            </DialogTitle>
                          </DialogHeader>
                          {selectedItem && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                  <div className="text-xl font-bold text-blue-300">
                                    {selectedItem.battery.soh.toFixed(1)}%
                                  </div>
                                  <div className="text-xs text-slate-400">State of Health</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xl font-bold text-emerald-300">
                                    {selectedItem.battery.rul}
                                  </div>
                                  <div className="text-xs text-slate-400">RUL</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xl font-bold text-purple-300">
                                    {selectedItem.battery.cycles.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-slate-400">Cycles</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xl font-bold text-orange-300">
                                    {selectedItem.battery.chemistry}
                                  </div>
                                  <div className="text-xs text-slate-400">Chemistry</div>
                                </div>
                              </div>
                              
                              <div className="bg-slate-800/40 p-4 rounded-lg">
                                <h4 className="font-medium text-slate-300 mb-2">Review Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Marked by:</span>
                                    <span className="text-slate-200">{selectedItem.marked_by_name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Marked on:</span>
                                    <span className="text-slate-200">
                                      {new Date(selectedItem.marked_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Review type:</span>
                                    <span className="text-slate-200 capitalize">
                                      {selectedItem.review_type}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {selectedItem.battery.notes && (
                                <div className="bg-slate-800/40 p-4 rounded-lg">
                                  <h4 className="font-medium text-slate-300 mb-2">Notes</h4>
                                  <p className="text-slate-300 text-sm whitespace-pre-wrap">
                                    {selectedItem.battery.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        onClick={() => removeFromReview(item.id)}
                        className="bg-red-600/70 hover:bg-red-600/85"
                      >
                        Complete Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
