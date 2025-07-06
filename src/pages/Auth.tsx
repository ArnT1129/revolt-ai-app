import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, User, Building2 } from 'lucide-react';
import LiquidGlassAI from '@/components/LiquidGlassAI';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate('/');
      } else {
        // Create metadata object for signUp
        const metadataObj = {
          first_name: firstName,
          last_name: lastName,
          company: accountType === 'company' ? company : undefined,
          account_type: accountType,
        };
        
        await signUp(email, password, JSON.stringify(metadataObj));
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication Error",
        description: error.message || "An error occurred during authentication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const metadataObj = {
        first_name: 'Demo',
        last_name: 'User',
        account_type: 'individual',
      };
      
      await signUp(`demo${Date.now()}@example.com`, 'demopassword123', JSON.stringify(metadataObj));
      toast({
        title: "Demo Account Created!",
        description: "Welcome to the demo experience.",
      });
      navigate('/?demo=true');
    } catch (error: any) {
      console.error('Demo login error:', error);
      toast({
        title: "Demo Error",
        description: "Failed to create demo account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 relative">
      {/* Aurora Background */}
      <div className="aurora-background fixed inset-0">
        <div className="aurora one"></div>
        <div className="aurora two"></div>
        <div className="aurora three"></div>
      </div>
      
      {/* LiquidGlassAI Background */}
      <div className="fixed inset-0 z-[1]">
        <LiquidGlassAI isActive={true} />
      </div>

      {/* Main content centered */}
      <div className="w-full max-w-md space-y-6 relative z-[2]">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8IS0tIExpZ2h0bmluZyBib2x0IGljb24gLS0+CjxwYXRoIGQ9Ik0yMCA2MEw0MCAyMEg1MEw0MCA0MEg1NUw0MCA2MEgzMEw0MCA0MEgyNUw0MCA2MEgyMFoiIGZpbGw9InVybCgjZ3JhZGllbnQxKSIvPgo8IS0tIFJlVm9sdCB0ZXh0IC0tPgo8dGV4dCB4PSI3MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIzNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9InVybCgjZ3JhZGllbnQyKSI+UmVWb2x0PC90ZXh0Pgo8ZGVmcz4KICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50MSIgeDE9IjIwIiB5MT0iMjAiIHgyPSI1NSIgeTI9IjYwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjOEI1Q0Y2Ii8+CiAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNBNzU1RkYiLz4KICA8L2xpbmVhckdyYWRpZW50PgogIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQyIiB4MT0iNzAiIHkxPSIyMCIgeDI9IjE4MCIgeTI9IjYwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMzk5NEY2Ii8+CiAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzU5OEVGNiIvPgogICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjOEI1Q0Y2Ii8+CiAgPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K"
              alt="ReVolt Logo" 
              className="h-12 w-auto"
            />
          </div>
          <p className="text-slate-400">Advanced Battery Analytics Platform</p>
        </div>

        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-center text-white">
              {isLogin ? 'Sign In' : 'Create Account'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  {/* Account Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-slate-300">Account Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={accountType === 'individual' ? 'default' : 'outline'}
                        className={`h-12 ${accountType === 'individual' ? 'glass-button' : 'glass-button-outline'}`}
                        onClick={() => setAccountType('individual')}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Individual
                      </Button>
                      <Button
                        type="button"
                        variant={accountType === 'company' ? 'default' : 'outline'}
                        className={`h-12 ${accountType === 'company' ? 'glass-button' : 'glass-button-outline'}`}
                        onClick={() => setAccountType('company')}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Company
                      </Button>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-slate-300">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="glass-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-slate-300">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="glass-input"
                        required
                      />
                    </div>
                  </div>

                  {/* Company Information - only show if company account type */}
                  {accountType === 'company' && (
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-slate-300">Company Name *</Label>
                      <Input
                        id="company"
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="glass-input"
                        placeholder="Your company name"
                        required
                      />
                    </div>
                  )}
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full glass-button" 
                disabled={loading}
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>

            <Separator className="bg-white/10" />

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full glass-button-outline"
                onClick={handleDemoLogin}
                disabled={loading}
              >
                Try Demo Account
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-slate-300 hover:text-white"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-slate-400">
          <p>Secure battery analytics and management platform</p>
        </div>
      </div>
    </div>
  );
}
