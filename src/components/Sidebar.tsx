
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Battery, 
  Upload, 
  Search, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  User,
  Building2,
  FileSearch,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: BarChart3,
      description: 'Overview and analytics'
    },
    {
      name: 'Upload',
      href: '/upload',
      icon: Upload,
      description: 'Create battery passports'
    },
    {
      name: 'Search',
      href: '/search',
      icon: Search,
      description: 'Find and filter batteries'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: TrendingUp,
      description: 'Advanced analytics'
    },
    {
      name: 'Comparison',
      href: '/comparison',
      icon: FileSearch,
      description: 'Compare batteries'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      description: 'User settings'
    },
    {
      name: 'Company',
      href: '/company',
      icon: Building2,
      description: 'Company management'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'App preferences'
    }
  ];

  return (
    <div className={cn(
      "h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-white/10 transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-transparent flex items-center justify-center rounded-lg">
              <Battery className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">BatteryAI</h1>
              <p className="text-slate-400 text-xs">Passport System</p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-slate-400 text-xs truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors group relative",
                isActive 
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-blue-400" : "text-slate-400 group-hover:text-white"
              )} />
              
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-slate-500 group-hover:text-slate-400">
                    {item.description}
                  </p>
                </div>
              )}
              
              {isActive && (
                <div className="absolute right-2">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
                    Active
                  </Badge>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        {!collapsed ? (
          <div className="text-center">
            <p className="text-slate-500 text-xs">
              Battery Passport System
            </p>
            <p className="text-slate-600 text-xs mt-1">
              v2.0.0
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <Battery className="h-4 w-4 text-slate-500" />
          </div>
        )}
      </div>
    </div>
  );
}
