import { useState } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  Upload,
  Search,
  BarChart3,
  GitCompare,
  FileText,
  Building2,
  Settings,
  User,
  Menu,
  X,
  LogOut
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Comparison', href: '/comparison', icon: GitCompare },
  { name: 'Review', href: '/review', icon: FileText },
];

const bottomNavigation = [
  { name: 'Company', href: '/company', icon: Building2 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: User },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account",
      });
      
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-900/95 backdrop-blur-md border-r border-white/10 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!isCollapsed && (
            <div className="flex items-center justify-center flex-1">
              <img 
                src="/download.png" 
                alt="ReVolt" 
                className="h-12 w-auto object-contain mix-blend-screen"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        {/* Collapsed state logo */}
        {isCollapsed && (
          <div className="flex justify-center p-2 border-b border-white/10">
            <img 
              src="/download.png" 
              alt="ReVolt" 
              className="h-8 w-auto object-contain mix-blend-screen"
            />
          </div>
        )}

        {/* User Info */}
        {!isCollapsed && user && (
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.email}
                </p>
                <p className="text-xs text-slate-400">
                  Battery Engineer
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive: linkIsActive }) =>
                `group flex items-center ${isCollapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2'} text-sm font-medium rounded-lg transition-all duration-200 ${
                  linkIsActive || isActive(item.href)
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <item.icon className={`${isCollapsed ? 'h-5 w-5' : 'h-5 w-5 mr-3'} flex-shrink-0`} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div>
          <nav className="px-4 py-4 space-y-2">
            {bottomNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive: linkIsActive }) =>
                  `group flex items-center ${isCollapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2'} text-sm font-medium rounded-lg transition-all duration-200 ${
                    linkIsActive || isActive(item.href)
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <item.icon className={`${isCollapsed ? 'h-5 w-5' : 'h-5 w-5 mr-3'} flex-shrink-0`} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            ))}
            
            {/* Sign Out Button */}
            <Button
              onClick={handleSignOut}
              disabled={isSigningOut}
              variant="ghost"
              className={`w-full ${isCollapsed ? 'justify-center px-3 py-3' : 'justify-start px-3'} text-slate-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/30`}
            >
              <LogOut className={`${isCollapsed ? 'h-5 w-5' : 'h-5 w-5 mr-3'} flex-shrink-0`} />
              {!isCollapsed && (
                <span className="truncate">
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </span>
              )}
            </Button>
          </nav>
        </div>
      </div>

      {/* Spacer for fixed sidebar */}
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 transition-all duration-300`} />
    </>
  );
}
