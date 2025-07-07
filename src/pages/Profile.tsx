
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Building2, Mail, Calendar, Shield, Settings, Key } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  company?: string;
  role?: string;
  created_at?: string;
  is_demo?: boolean;
}

export default function Profile() {
  const { user } = useAuth();
  const { userCompanies, isCompanyMode, currentCompany } = useCompany();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          company: profile.company,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="h-32 bg-white/10 rounded"></div>
                <div className="h-64 bg-white/10 rounded"></div>
              </div>
              <div className="h-96 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {profile.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {profile.full_name || profile.email}
            </h1>
            <p className="text-slate-400">
              {isCompanyMode ? `${currentCompany?.name} • ${profile.role || 'Member'}` : 'Individual Account'}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name" className="text-slate-300">First Name</Label>
                      <Input
                        id="first-name"
                        value={profile.first_name || ''}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        className="glass-input"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name" className="text-slate-300">Last Name</Label>
                      <Input
                        id="last-name"
                        value={profile.last_name || ''}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        className="glass-input"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="glass-input opacity-60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-slate-300">Company</Label>
                    <Input
                      id="company"
                      value={profile.company || ''}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      className="glass-input"
                      placeholder="Enter company name"
                    />
                  </div>

                  <Button type="submit" disabled={saving} className="w-full glass-button">
                    {saving ? 'Saving...' : 'Update Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-400">Add an extra layer of security</p>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                  />
                </div>
                
                <Separator className="bg-white/10" />
                
                <Button variant="outline" className="w-full glass-button">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Account Overview */}
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="h-5 w-5" />
                Account Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Account Status */}
              <div>
                <h3 className="text-white font-medium mb-3">Account Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Account Type</span>
                    <Badge variant={isCompanyMode ? "default" : "secondary"}>
                      {isCompanyMode ? 'Company' : 'Individual'}
                    </Badge>
                  </div>
                  {profile.is_demo && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Demo Account</span>
                      <Badge variant="outline">Demo</Badge>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Member Since</span>
                    <span className="text-white">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Company Memberships */}
              <div>
                <h3 className="text-white font-medium mb-3">Company Memberships</h3>
                {userCompanies.length > 0 ? (
                  <div className="space-y-3">
                    {userCompanies.map((company) => (
                      <div key={company.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-blue-400" />
                          <div>
                            <p className="text-white font-medium">{company.name}</p>
                            {company.domain && (
                              <p className="text-xs text-slate-400">{company.domain}</p>
                            )}
                          </div>
                        </div>
                        {currentCompany?.id === company.id && (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No company memberships</p>
                )}
              </div>

              <Separator className="bg-white/10" />

              {/* Account Statistics */}
              <div>
                <h3 className="text-white font-medium mb-3">Account Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-2xl font-bold text-blue-400">0</div>
                    <div className="text-xs text-slate-400">Batteries Uploaded</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-2xl font-bold text-green-400">0</div>
                    <div className="text-xs text-slate-400">Reports Generated</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
