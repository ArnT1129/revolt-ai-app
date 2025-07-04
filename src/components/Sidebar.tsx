
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { CompanySelector } from "./CompanySelector";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Upload, 
  Search,
  Settings, 
  LogOut, 
  Menu,
  X,
  Battery,
  Building2,
  Users
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const { isCompanyMode, currentCompany, toggleCompanyMode } = useCompany();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Upload, label: "Upload", path: "/upload" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden glass-button"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-in-out",
        "md:relative md:translate-x-0",
        isCollapsed ? "-translate-x-full" : "translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Battery className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold text-white">BatteryIQ</h1>
                <p className="text-xs text-slate-400">Analytics Platform</p>
              </div>
            </div>
          </div>

          {/* Company Mode Toggle */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-300">View Mode</span>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleCompanyMode}
                className="glass-button h-8"
              >
                {isCompanyMode ? (
                  <><Building2 className="h-3 w-3 mr-1" />Company</>
                ) : (
                  <><Users className="h-3 w-3 mr-1" />Personal</>
                )}
              </Button>
            </div>
            
            {isCompanyMode && (
              <div className="space-y-2">
                <CompanySelector />
                {currentCompany && (
                  <Badge variant="secondary" className="w-full justify-center">
                    <Building2 className="h-3 w-3 mr-1" />
                    {currentCompany.name}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-4">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start glass-button",
                    location.pathname === item.path && "bg-blue-500/20 text-blue-400"
                  )}
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              ))}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-6 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-slate-400">
                  {isCompanyMode ? 'Company Account' : 'Personal Account'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full glass-button"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}
