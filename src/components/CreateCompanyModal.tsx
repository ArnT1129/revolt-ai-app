
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCompanyModal({ isOpen, onClose }: CreateCompanyModalProps) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const { createCompany } = useCompany();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Company name is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await createCompany(name.trim(), domain.trim() || undefined);
      toast({
        title: "Success",
        description: "Company created successfully!"
      });
      setName('');
      setDomain('');
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create company",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="enhanced-card">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Company</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-slate-300">Company Name</Label>
            <Input
              id="companyName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input"
              placeholder="Enter company name"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyDomain" className="text-slate-300">
              Domain (Optional)
            </Label>
            <Input
              id="companyDomain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="glass-input"
              placeholder="company.com"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 glass-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 glass-button"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Company
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
