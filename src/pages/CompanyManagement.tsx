
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import CompanyDashboard from '@/components/CompanyDashboard';
import BatteryAccessControl from '@/components/BatteryAccessControl';
import CompanyAuditLog from '@/components/CompanyAuditLog';
import { Building2, Shield, Activity, Users, Settings as SettingsIcon, Mail, Plus, Trash2 } from 'lucide-react';

export default function CompanyManagement() {
  const { currentCompany, isCompanyMode, userCompanies } = useCompany();
  const { toast } = useToast();
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyName, setCompanyName] = useState(currentCompany?.name || '');
  const [companyDomain, setCompanyDomain] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

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

  const handleUpdateCompany = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Here you would typically call an API to update the company
      toast({
        title: "Success",
        description: "Company information updated successfully",
      });
      setIsEditingCompany(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update company information",
        variant: "destructive",
      });
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Email address is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Here you would typically call an API to send the invitation
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}`,
      });
      setInviteEmail('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">{currentCompany.name} Management</h1>
          <p className="text-slate-400">Manage your company's battery analytics platform</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="glass-button w-full md:w-auto">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
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

        <TabsContent value="settings">
          <div className="space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white">Company Information</CardTitle>
                <CardDescription>Manage your company's basic information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditingCompany ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-slate-300">Company Name</Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="glass-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyDomain" className="text-slate-300">Domain (optional)</Label>
                      <Input
                        id="companyDomain"
                        value={companyDomain}
                        onChange={(e) => setCompanyDomain(e.target.value)}
                        placeholder="company.com"
                        className="glass-input"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateCompany} className="glass-button">
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingCompany(false)}
                        className="glass-button"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Company Name</Label>
                      <p className="text-white mt-1">{currentCompany.name}</p>
                    </div>
                    <div>
                      <Label className="text-slate-300">Domain</Label>
                      <p className="text-white mt-1">{currentCompany.domain || 'Not set'}</p>
                    </div>
                    <Button 
                      onClick={() => setIsEditingCompany(true)}
                      className="glass-button"
                    >
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Edit Information
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white">Invite Team Members</CardTitle>
                <CardDescription>Send invitations to new team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                  <Button onClick={handleInviteUser} className="glass-button">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invite
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white">Team Members</CardTitle>
                <CardDescription>Manage your team members and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">A</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Admin User</p>
                        <p className="text-slate-400 text-sm">admin@company.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Owner</Badge>
                    </div>
                  </div>
                  
                  <div className="text-center py-8 text-slate-400">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No additional team members yet</p>
                    <p className="text-sm">Invite team members to get started</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
