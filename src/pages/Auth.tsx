
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Battery, Building, Lock, User, Shield, Smartphone } from 'lucide-react';
import LiquidGlassAI from '@/components/LiquidGlassAI';

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
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const signUp = async (e: React.FormEvent) => {
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
        // Enroll MFA
        const { data: mfaData, error: mfaError } = await supabase.auth.mfa.enroll({
          factorType: 'totp'
        });

        if (mfaError) throw mfaError;

        setQrCodeUrl(mfaData.totp.qr_code);
        setShowMFASetup(true);
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

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has MFA enabled
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors && factors.totp && factors.totp.length > 0) {
        setShowMFASetup(true);
      } else {
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

  const verifyMFA = async () => {
    if (!totpCode) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors && factors.totp && factors.totp.length > 0) {
        // Verify MFA for sign in
        const { data, error } = await supabase.auth.mfa.challengeAndVerify({
          factorId: factors.totp[0].id,
          code: totpCode,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        navigate('/');
      } else {
        // Complete MFA enrollment
        const { data, error } = await supabase.auth.mfa.verify({
          factorId: qrCodeUrl ? 'new' : '',
          code: totpCode,
          challengeId: ''
        });

        if (error) throw error;

        toast({
          title: "2FA Setup Complete!",
          description: "Your account is now secured with two-factor authentication.",
        });
        setShowMFASetup(false);
      }
    } catch (error: any) {
      console.error('MFA verification error:', error);
      setError(error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  if (showMFASetup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LiquidGlassAI />
        <Card className="w-full max-w-md enhanced-card">
          <CardHeader className="text-center">
            <CardTitle className="text-white flex items-center justify-center gap-2">
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
                className="glass-input text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            {error && (
              <Alert className="border-red-600/50 bg-red-900/20">
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={verifyMFA}
              disabled={isLoading || !totpCode}
              className="w-full glass-button"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <LiquidGlassAI />
      <Card className="w-full max-w-md enhanced-card">
        <CardHeader className="text-center">
          <CardTitle className="text-white flex items-center justify-center gap-2">
            <Battery className="h-6 w-6 text-blue-400" />
            Battery Analytics Platform
          </CardTitle>
          <CardDescription>
            Advanced battery management and analytics solution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 glass-button">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-slate-300">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="glass-input"
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
                    className="glass-input"
                  />
                </div>

                {error && (
                  <Alert className="border-red-600/50 bg-red-900/20">
                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={isLoading} className="w-full glass-button">
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-400">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={signInWithGoogle}
                  disabled={isLoading}
                  className="w-full glass-button"
                >
                  Sign in with Google
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                {/* Account Type Selection */}
                <div className="space-y-3">
                  <Label className="text-slate-300">Account Type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={accountType === 'individual' ? 'default' : 'outline'}
                      onClick={() => setAccountType('individual')}
                      className="flex-1 glass-button"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Individual
                    </Button>
                    <Button
                      type="button"
                      variant={accountType === 'company' ? 'default' : 'outline'}
                      onClick={() => setAccountType('company')}
                      className="flex-1 glass-button"
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
                      className="glass-input"
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
                      className="glass-input"
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
                      className="glass-input"
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
                    className="glass-input"
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
                    className="glass-input"
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
                    className="glass-input"
                  />
                </div>

                {/* 2FA Option */}
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

                <Button type="submit" disabled={isLoading} className="w-full glass-button">
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-400">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={signInWithGoogle}
                  disabled={isLoading}
                  className="w-full glass-button"
                >
                  Sign up with Google
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
