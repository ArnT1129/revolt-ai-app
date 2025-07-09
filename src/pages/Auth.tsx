
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
import { Building, Lock, User, Shield, Smartphone, Battery, Zap, TrendingUp } from 'lucide-react';

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
      const demoEmail = 'demo@revolt.ai';
      const demoPassword = 'demo123456';

      let { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (error && error.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: 'Demo',
              last_name: 'User',
              full_name: 'Demo User',
              account_type: 'individual'
            }
          }
        });

        if (signUpError) {
          console.error('Demo signup error:', signUpError);
          throw new Error('Failed to create demo account');
        }

        if (signUpData.user) {
          try {
            await supabase.rpc('setup_demo_user', { user_id: signUpData.user.id });
          } catch (rpcError) {
            console.warn('Demo setup function not available:', rpcError);
          }
          
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: demoEmail,
            password: demoPassword,
          });
          
          if (signInError) throw signInError;
        }
      } else if (error) {
        throw error;
      }

      toast({
        title: "Demo Account Loaded!",
        description: "Exploring ReVolt Analytics with sample data.",
      });
      
      setTimeout(() => {
        navigate('/');
      }, 100);
      
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
        setShowMFASetup(false);
        navigate('/');
      } else {
        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId: mfaFactorId
        });

        if (challengeError) throw challengeError;

        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: mfaFactorId,
          code: totpCode,
          challengeId: challengeData.id
        });

        if (verifyError) throw verifyError;

        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error('MFA verification error:', error);
      setError(error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Card className="w-full max-w-md backdrop-blur-xl bg-slate-900/80 border-slate-700/50">
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
              src="/lovable-uploads/91171b44-dc50-495d-8eaa-2d7b71a48b70.png" 
              alt="ReVolt Logo" 
              className="h-12 w-auto"
            />
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
                src="/lovable-uploads/91171b44-dc50-495d-8eaa-2d7b71a48b70.png" 
                alt="ReVolt Logo" 
                className="h-8 w-auto"
              />
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
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 relative z-30">
                <TabsTrigger value="signin" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">Sign Up</TabsTrigger>
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

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full bg-white/10 border-slate-600 text-white hover:bg-white/20 relative z-30"
                  >
                    Sign in with Google
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

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full bg-white/10 border-slate-600 text-white hover:bg-white/20 relative z-30"
                  >
                    Sign up with Google
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
