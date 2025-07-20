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
  LogOut,
  FlaskConical,
  TrendingUp,
  Brain,
  Flag,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Comparison', href: '/comparison', icon: GitCompare },
  { name: 'Review', href: '/review', icon: FileText },
  { name: 'Agent Mode', href: '/ai-agent', icon: FlaskConical },
];

const bottomNavigation = [
  { name: 'Company', href: '/company-management', icon: Building2 },
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
      <div className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 border-r border-gray-700/50 shadow-2xl transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700/50 bg-gray-900/50">
          <div className="flex justify-center flex-1">
            <img 
              src="/download.png" 
              alt="ReVolt" 
              className={`w-auto object-contain mix-blend-screen transition-all duration-300 ${
                isCollapsed ? 'h-6' : 'h-12'
              }`}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <X className="h-3 w-3" />}
          </Button>
        </div>

        {/* User Info */}
        {!isCollapsed && user && (
          <div className="p-3 border-b border-gray-700/50 bg-gray-800/30">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-gray-600">
                <User className="h-3 w-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.email}
                </p>
                <p className="text-xs text-gray-400">
                  Battery Engineer
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={`group flex items-center rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/30 shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:shadow-md'
                  } ${isCollapsed ? 'justify-center p-2 w-12 h-12 mx-auto' : 'gap-3 px-3 py-2'}`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 transition-all duration-200 ${
                    active ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'
                  }`} />
                  {!isCollapsed && (
                    <span className={`font-medium transition-colors duration-200 truncate ${
                      active ? 'text-blue-400' : 'text-gray-300 group-hover:text-white'
                    }`}>
                      {item.name}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="p-2 space-y-1 border-t border-gray-700/30">
          {bottomNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`group flex items-center rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 text-gray-200 border border-gray-600/30'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                } ${isCollapsed ? 'justify-center p-2 w-12 h-12 mx-auto' : 'gap-3 px-3 py-2'}`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 transition-all duration-200 ${
                  active ? 'text-gray-200' : 'text-gray-400 group-hover:text-white'
                }`} />
                {!isCollapsed && (
                  <span className={`font-medium transition-colors duration-200 truncate ${
                    active ? 'text-gray-200' : 'text-gray-400 group-hover:text-white'
                  }`}>
                    {item.name}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Sign Out Button */}
        <div className="p-2 border-t border-gray-700/50 bg-gray-800/30">
          <Button
            onClick={handleSignOut}
            disabled={isSigningOut}
            variant="ghost"
            title={isCollapsed ? 'Sign out' : undefined}
            className={`group transition-all duration-200 ${
              isCollapsed 
                ? 'w-12 h-12 mx-auto p-2 hover:bg-red-500/20 hover:text-red-400' 
                : 'w-full justify-start px-3 py-2 hover:bg-red-500/10 hover:text-red-400'
            }`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0 transition-all duration-200" />
            {!isCollapsed && (
              <span className="ml-3 font-medium truncate">
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </span>
            )}
          </Button>
        </div>
      </div>
      
      {/* Spacer for fixed sidebar */}
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 transition-all duration-300 ease-in-out`} />
    </>
  );
}