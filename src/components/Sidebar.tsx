import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import CompanySelector from "./CompanySelector";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Upload, 
  Search,
  Settings, 
  LogOut, 
  Menu,
  X,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const { isCompanyMode, currentCompany, switchToCompany, switchToIndividual } = useCompany();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Upload, label: "Upload", path: "/upload" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Add company management for company mode
  const companyMenuItems = isCompanyMode ? [
    { icon: Building2, label: "Company", path: "/company" },
  ] : [];

  const allMenuItems = [...menuItems, ...companyMenuItems];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
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
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 bg-black/20 backdrop-blur-xl border-r border-white/10 transform transition-all duration-300 ease-in-out",
        "md:relative md:translate-x-0",
        // Mobile responsive
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0", // Always visible on desktop
        // Width based on collapsed state
        isCollapsed ? "w-16" : "w-56"
      )}>
        <div className="flex flex-col h-full">
          {/* Header with collapse button */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className={cn(
                "flex items-center gap-3 transition-opacity duration-200",
                isCollapsed && "opacity-0"
              )}>
                <div className="h-8 w-8 flex items-center justify-center">
                  <svg viewBox="0 0 40 40" className="h-8 w-8">
                    <defs>
                      <linearGradient id="revolt-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00D4FF" />
                        <stop offset="50%" stopColor="#0099FF" />
                        <stop offset="100%" stopColor="#6B46C1" />
                      </linearGradient>
                    </defs>
                    <path d="M8 28 L18 8 L16 14 L24 14 L32 12 L22 32 L24 26 L16 26 L8 28 Z" fill="url(#revolt-gradient)" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">ReVolt</h1>
                  <p className="text-xs text-slate-400">Analytics Platform</p>
                </div>
              </div>
            
            {/* Collapsed state - show only the collapse button aligned with other buttons */}
            {isCollapsed && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 glass-button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Company Mode Toggle */}
          {!isCollapsed && (
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-300">View Mode</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => isCompanyMode ? switchToIndividual() : navigate('/company')}
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
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-3">
            <div className="space-y-2">
              {allMenuItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? "secondary" : "ghost"}
                  className={cn(
                    "w-full glass-button",
                    location.pathname === item.path && "bg-blue-500/20 text-blue-400",
                    isCollapsed ? "justify-center px-0" : "justify-start"
                  )}
                  onClick={() => handleNavigation(item.path)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                  {!isCollapsed && item.label}
                </Button>
              ))}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/10">
            {!isCollapsed ? (
              <>
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
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 glass-button"
                  onClick={handleSignOut}
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
