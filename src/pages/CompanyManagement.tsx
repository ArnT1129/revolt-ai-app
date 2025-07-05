
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompany } from '@/contexts/CompanyContext';
import CompanyDashboard from '@/components/CompanyDashboard';
import BatteryAccessControl from '@/components/BatteryAccessControl';
import CompanyAuditLog from '@/components/CompanyAuditLog';
import { Building2, Shield, Activity } from 'lucide-react';

export default function CompanyManagement() {
  const { currentCompany, isCompanyMode } = useCompany();

  if (!isCompanyMode || !currentCompany) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Company Selected</h2>
          <p className="text-slate-400">
            Switch to company mode and select a company to access management features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Company Management</h1>
          <p className="text-slate-400">Manage your company's battery analytics platform</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="glass-button w-full md:w-auto">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Access Control
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <CompanyDashboard />
        </TabsContent>

        <TabsContent value="access">
          <BatteryAccessControl />
        </TabsContent>

        <TabsContent value="audit">
          <CompanyAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
