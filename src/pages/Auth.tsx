
import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Building, Lock, User, Shield, Smartphone, Battery, Zap, TrendingUp, Mail, Key, Users, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { DemoService } from '@/services/demoService';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  const [enable2FA, setEnable2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [error, setError] = useState('');
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState('');
  
  // Company joining functionality
  const [showJoinCompanyModal, setShowJoinCompanyModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [companyInvitation, setCompanyInvitation] = useState<Record<string, any> | null>(null);
  const [joiningCompany, setJoiningCompany] = useState(false);
  const [searchingInvitation, setSearchingInvitation] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const metadata = {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        account_type: accountType,
        ...(accountType === 'company' && { company })
      };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: metadata
        }
      });

      if (error) throw error;

      if (data.user && enable2FA) {
        try {
          const { data: mfaData, error: mfaError } = await supabase.auth.mfa.enroll({
            factorType: 'totp',
            friendlyName: 'Battery Analytics Platform'
          });

          if (mfaError) throw mfaError;

          if (mfaData?.totp?.qr_code) {
            setQrCodeUrl(mfaData.totp.qr_code);
            setMfaFactorId(mfaData.id);
            setShowMFASetup(true);
          }
        } catch (mfaError) {
          console.error('MFA setup error:', mfaError);
          toast({
            title: "Sign up successful!",
            description: "Please check your email to verify your account. (2FA setup failed)",
          });
        }
      } else {
        toast({
          title: "Sign up successful!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message || 'An error occurred during sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      try {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        if (factors?.totp && factors.totp.length > 0) {
          setMfaFactorId(factors.totp[0].id);
          setShowMFASetup(true);
        } else {
          toast({
            title: "Welcome back!",
            description: "You have been signed in successfully.",
          });
          navigate('/');
        }
      } catch (mfaError) {
        console.error('MFA check error:', mfaError);
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryDemo = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { user, error } = await DemoService.createDemoAccount();

      if (error) {
        throw error;
      }

      if (user) {
        toast({
          title: "Demo Account Loaded!",
          description: "Exploring ReVolt Analytics with sample data.",
        });
        
        setTimeout(() => {
          navigate('/');
        }, 100);
      } else {
        throw new Error('Failed to create demo account');
      }
      
    } catch (error: any) {
      console.error('Demo account error:', error);
      setError('Failed to load demo account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (!totpCode) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (qrCodeUrl) {
        const { error } = await supabase.auth.mfa.verify({
          factorId: mfaFactorId,
          code: totpCode,
          challengeId: ''
        });

        if (error) throw error;

        toast({
          title: "2FA Setup Complete!",
          description: "Your account is now secured with two-factor authentication.",
        });
      } else {
        const { error } = await supabase.auth.mfa.verify({
          factorId: mfaFactorId,
          code: totpCode,
          challengeId: ''
        });

        if (error) throw error;
      }

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      navigate('/');
    } catch (error: any) {
      console.error('MFA verification error:', error);
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInvitation = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invitation code');
      return;
    }

    setSearchingInvitation(true);
    setError('');

    try {
      const { data: invitation, error } = await supabase
        .from('company_invitations')
        .select(`
          *,
          companies!inner(id, name, domain)
        `)
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .eq('accepted', false)
        .eq('email', email)
        .single();

      if (error || !invitation) {
        setError('Invalid or expired invitation code');
        return;
      }

      const expiresAt = new Date(invitation.expires_at);
      if (expiresAt < new Date()) {
        setError('This invitation has expired');
        return;
      }

      setCompanyInvitation(invitation);
      toast({
        title: "Invitation Found!",
        description: `You're invited to join ${invitation.companies.name}`,
      });
    } catch (error) {
      console.error('Search invitation error:', error);
      setError('Invalid or expired invitation code');
    } finally {
      setSearchingInvitation(false);
    }
  };

  const handleJoinCompany = async () => {
    if (!companyInvitation) return;

    setJoiningCompany(true);
    setError('');

    try {
      // First, create the user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            account_type: 'company'
          }
        }
      });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        // Add user to company
        const { error: memberError } = await supabase
          .from('company_members')
          .insert({
            company_id: companyInvitation.company_id,
            user_id: signUpData.user.id,
            role: companyInvitation.role,
            joined_at: new Date().toISOString()
          });

        if (memberError) throw memberError;

        // Mark invitation as accepted
        const { error: updateError } = await supabase
          .from('company_invitations')
          .update({ accepted: true })
          .eq('id', companyInvitation.id);

        if (updateError) throw updateError;

        toast({
          title: "Welcome to the team!",
          description: `You've successfully joined ${companyInvitation.companies.name}`,
        });

        setShowJoinCompanyModal(false);
        setCompanyInvitation(null);
        setInviteCode('');
      }
    } catch (error: any) {
      console.error('Join company error:', error);
      setError(error.message || 'Failed to join company');
    } finally {
      setJoiningCompany(false);
    }
  };

  if (showMFASetup) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-12 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <img 
                src="/download.png" 
                alt="ReVolt Logo" 
                className="h-16 w-auto"
              />
              <div>
                <h1 className="text-4xl font-bold text-white">ReVolt Analytics</h1>
                <p className="text-xl text-blue-200">Advanced Battery Intelligence</p>
              </div>
            </div>
            
            <div className="space-y-6 mb-12">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Battery className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Smart Battery Monitoring</h3>
                  <p className="text-slate-300">Real-time health analysis and predictive maintenance</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Performance Analytics</h3>
                  <p className="text-slate-300">Advanced insights into battery performance trends</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Zap className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">AI-Powered Predictions</h3>
                  <p className="text-slate-300">Machine learning for accurate RUL estimation</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <Badge variant="outline" className="border-blue-400/50 text-blue-300">Enterprise Ready</Badge>
              <Badge variant="outline" className="border-green-400/50 text-green-300">ISO Certified</Badge>
              <Badge variant="outline" className="border-purple-400/50 text-purple-300">AI-Powered</Badge>
            </div>
          </div>
        </div>

        {/* Right Side - MFA Setup */}
        <div className="flex-1 lg:flex-none lg:w-[500px] flex items-center justify-center p-6 relative z-20">
          <Card className="w-full max-w-md backdrop-blur-xl bg-slate-900/90 border-slate-700/50 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
                <img 
                  src="/download.png" 
                  alt="ReVolt Logo" 
                  className="h-8 w-auto"
                />
                <span className="text-xl font-bold text-white">ReVolt Analytics</span>
              </div>
              <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
                <Shield className="h-6 w-6 text-green-400" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                {qrCodeUrl ? 'Scan the QR code with your authenticator app' : 'Enter the code from your authenticator app'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {qrCodeUrl && (
                <div className="text-center">
                  <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-4" />
                  <p className="text-sm text-slate-400 mb-4">
                    Scan this QR code with Google Authenticator, Authy, or any TOTP app
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="totpCode" className="text-slate-300">Verification Code</Label>
                <Input
                  id="totpCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="bg-slate-800/50 border-slate-600 text-white text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              {error && (
                <Alert className="border-red-600/50 bg-red-900/20">
                  <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleVerifyMFA}
                disabled={isLoading || !totpCode}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <img 
              src="/download.png" 
              alt="ReVolt Logo" 
              className="h-16 w-auto"
            />
            <div>
              <h1 className="text-4xl font-bold text-white">ReVolt Analytics</h1>
              <p className="text-xl text-blue-200">Advanced Battery Intelligence</p>
            </div>
          </div>
          
          <div className="space-y-6 mb-12">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Battery className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Smart Battery Monitoring</h3>
                <p className="text-slate-300">Real-time health analysis and predictive maintenance</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Performance Analytics</h3>
                <p className="text-slate-300">Advanced insights into battery performance trends</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">AI-Powered Predictions</h3>
                <p className="text-slate-300">Machine learning for accurate RUL estimation</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <Badge variant="outline" className="border-blue-400/50 text-blue-300">Enterprise Ready</Badge>
            <Badge variant="outline" className="border-green-400/50 text-green-300">ISO Certified</Badge>
            <Badge variant="outline" className="border-purple-400/50 text-purple-300">AI-Powered</Badge>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 lg:flex-none lg:w-[500px] flex items-center justify-center p-6 relative z-20">
        <Card className="w-full max-w-md backdrop-blur-xl bg-slate-900/90 border-slate-700/50 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
              <img 
                src="/download.png" 
                alt="ReVolt Logo" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-white">ReVolt Analytics</span>
            </div>
            <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
        
          <CardContent>
            {/* Demo Account Button */}
            <Button
              onClick={handleTryDemo}
              disabled={isLoading}
              variant="outline"
              className="w-full mb-6 bg-blue-600/20 border-blue-500/50 text-blue-300 hover:bg-blue-600/30 hover:border-blue-400 backdrop-blur-sm relative z-30"
              type="button"
            >
              <Battery className="h-4 w-4 mr-2" />
              Try Demo Account
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-400">Or continue with</span>
              </div>
            </div>
            
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 relative z-30">
                <TabsTrigger value="signin" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">Sign Up</TabsTrigger>
                <TabsTrigger value="join" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">Join Company</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-slate-300">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 relative z-30"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-slate-300">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 relative z-30"
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <Alert className="border-red-600/50 bg-red-900/20">
                      <AlertDescription className="text-red-300">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white relative z-30"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-slate-300">Account Type</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={accountType === 'individual' ? 'default' : 'outline'}
                        onClick={() => setAccountType('individual')}
                        className={`flex-1 relative z-30 ${
                          accountType === 'individual' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50'
                        }`}
                        disabled={isLoading}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Individual
                      </Button>
                      <Button
                        type="button"
                        variant={accountType === 'company' ? 'default' : 'outline'}
                        onClick={() => setAccountType('company')}
                        className={`flex-1 relative z-30 ${
                          accountType === 'company' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50'
                        }`}
                        disabled={isLoading}
                      >
                        <Building className="h-4 w-4 mr-2" />
                        Company
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-slate-300">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 relative z-30"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-slate-300">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 relative z-30"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {accountType === 'company' && (
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-slate-300">Company Name</Label>
                      <Input
                        id="company"
                        placeholder="Acme Corp"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        required
                        className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 relative z-30"
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 relative z-30"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 relative z-30"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 relative z-30"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-600/30">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-green-400" />
                      <div>
                        <Label className="text-slate-300 font-medium">Two-Factor Authentication</Label>
                        <p className="text-xs text-slate-400">Secure your account with 2FA</p>
                      </div>
                    </div>
                    <Switch
                      checked={enable2FA}
                      onCheckedChange={setEnable2FA}
                      disabled={isLoading}
                      className="relative z-30"
                    />
                  </div>

                  {enable2FA && (
                    <Alert className="border-green-600/50 bg-green-900/20">
                      <Shield className="h-4 w-4" />
                      <AlertDescription className="text-green-300">
                        You'll be guided through 2FA setup after creating your account.
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert className="border-red-600/50 bg-red-900/20">
                      <AlertDescription className="text-red-300">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white relative z-30"
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="join">
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-white">Join Your Company</h3>
                    <p className="text-slate-400 text-sm">Use an invitation code to join your team</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-code" className="text-slate-300">Invitation Code</Label>
                      <div className="flex gap-2">
                        <Input
                          id="invite-code"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value)}
                          placeholder="Enter invitation code"
                          className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 relative z-30 flex-1"
                          disabled={searchingInvitation}
                        />
                        <Button
                          type="button"
                          onClick={handleSearchInvitation}
                          disabled={searchingInvitation || !inviteCode.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white relative z-30"
                        >
                          {searchingInvitation ? 'Searching...' : 'Search'}
                        </Button>
                      </div>
                    </div>

                    {companyInvitation && (
                      <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <span className="text-green-400 font-medium">Invitation Found!</span>
                        </div>
                        <div className="text-white font-medium">{companyInvitation.companies.name}</div>
                        <div className="text-slate-400 text-sm">
                          Role: {companyInvitation.role} • Expires: {new Date(companyInvitation.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {error && (
                      <Alert className="border-red-600/50 bg-red-900/20">
                        <AlertDescription className="text-red-300">{error}</AlertDescription>
                      </Alert>
                    )}

                    {companyInvitation ? (
                      <Dialog open={showJoinCompanyModal} onOpenChange={setShowJoinCompanyModal}>
                        <DialogTrigger asChild>
                          <Button className="w-full bg-green-600 hover:bg-green-700 text-white relative z-30">
                            <Users className="h-4 w-4 mr-2" />
                            Join Company
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border-slate-600">
                          <DialogHeader>
                            <DialogTitle className="text-white">Complete Your Registration</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="join-first-name" className="text-slate-300">First Name</Label>
                                <Input
                                  id="join-first-name"
                                  value={firstName}
                                  onChange={(e) => setFirstName(e.target.value)}
                                  placeholder="John"
                                  required
                                  className="bg-slate-700 border-slate-600 text-white"
                                />
                              </div>
                              <div>
                                <Label htmlFor="join-last-name" className="text-slate-300">Last Name</Label>
                                <Input
                                  id="join-last-name"
                                  value={lastName}
                                  onChange={(e) => setLastName(e.target.value)}
                                  placeholder="Doe"
                                  required
                                  className="bg-slate-700 border-slate-600 text-white"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="join-email" className="text-slate-300">Email</Label>
                              <Input
                                id="join-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@example.com"
                                required
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                            <div>
                              <Label htmlFor="join-password" className="text-slate-300">Password</Label>
                              <Input
                                id="join-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
                                required
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                            <div>
                              <Label htmlFor="join-confirm-password" className="text-slate-300">Confirm Password</Label>
                              <Input
                                id="join-confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm password"
                                required
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                            <div className="flex gap-3 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowJoinCompanyModal(false)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleJoinCompany}
                                disabled={joiningCompany || !firstName || !lastName || !email || !password || password !== confirmPassword}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                {joiningCompany ? 'Joining...' : 'Join Company'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="text-center py-4 text-slate-400">
                        <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Enter an invitation code to join your company</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
