import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import CreateCompanyModal from "./CreateCompanyModal";
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
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  MessageCircleWarning,
  BarChart3,
  GitCompare
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAccountSelectorOpen, setIsAccountSelectorOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user, signOut } = useAuth();
  const { isCompanyMode, currentCompany, userCompanies, switchToCompany, switchToIndividual } = useCompany();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Upload, label: "Upload", path: "/upload" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: GitCompare, label: "Comparison", path: "/comparison" },
    { icon: MessageCircleWarning, label: "Review", path: "/review" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Add company management for company mode
  const companyMenuItems = isCompanyMode ? [
    { icon: Building2, label: "Company", path: "/company" },
  ] : [];

  const allMenuItems = [...menuItems, ...companyMenuItems];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAccountSwitch = (type: 'individual' | 'company', companyId?: string) => {
    if (type === 'individual') {
      switchToIndividual();
    } else if (type === 'company' && companyId) {
      switchToCompany(companyId);
    }
    setIsAccountSelectorOpen(false);
  };

  const handleCreateCompany = () => {
    setShowCreateModal(true);
    setIsAccountSelectorOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsMobileMenuOpen(false);
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
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
        isCollapsed ? "w-16" : "w-56"
      )}>
        <div className="flex flex-col h-full relative">
          {/* Collapse button - aligned with dashboard when collapsed */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute z-10 h-8 w-8 glass-button hidden md:flex",
              "transition-all duration-300 ease-in-out",
              isCollapsed ? "top-20 right-2" : "top-4 right-4"
            )}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? 
              <ChevronRight className="h-4 w-4" /> : 
              <ChevronLeft className="h-4 w-4" />
            }
          </Button>

          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className={cn(
              "flex items-center transition-opacity duration-200",
              isCollapsed && "opacity-0"
            )}>
              <div className="h-8 w-8 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/91171b44-dc50-495d-8eaa-2d7b71a48b70.png" 
                  alt="ReVolt Logo" 
                  className="h-8 w-auto"
                />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-white">ReVolt</h1>
                <p className="text-xs text-slate-400">Analytics Platform</p>
              </div>
            </div>
          </div>

          {/* Account Selector - with fixed positioning */}
          <div className="px-4 py-3 border-b border-white/10 relative">
            {!isCollapsed ? (
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setIsAccountSelectorOpen(!isAccountSelectorOpen)}
                  className="w-full glass-button justify-between h-10"
                >
                  <div className="flex items-center">
                    {isCompanyMode ? (
                      <><Building2 className="h-4 w-4 mr-3" />Company</>
                    ) : (
                      <><User className="h-4 w-4 mr-3" />Personal</>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {/* Account Selector Dropdown - Fixed z-index and positioning */}
                {isAccountSelectorOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-[45]"
                      onClick={() => setIsAccountSelectorOpen(false)}
                    />
                    <Card className="absolute top-12 left-0 right-0 z-[60] enhanced-card bg-black/95 backdrop-blur-xl border border-white/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white">Switch Account</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button
                          variant={!isCompanyMode ? "secondary" : "ghost"}
                          onClick={() => handleAccountSwitch('individual')}
                          className="w-full justify-start glass-button"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Individual Account
                          {!isCompanyMode && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                        </Button>

                        {userCompanies.length > 0 && (
                          <>
                            <div className="text-xs text-slate-400 px-2 py-1">Companies</div>
                            {userCompanies.map((company) => (
                              <Button
                                key={company.id}
                                variant={currentCompany?.id === company.id ? "secondary" : "ghost"}
                                onClick={() => handleAccountSwitch('company', company.id)}
                                className="w-full justify-start glass-button"
                              >
                                <Building2 className="h-4 w-4 mr-2" />
                                {company.name}
                                {currentCompany?.id === company.id && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                              </Button>
                            ))}
                          </>
                        )}

                        <div className="pt-2 border-t border-white/10">
                          <Button
                            variant="ghost"
                            onClick={handleCreateCompany}
                            className="w-full justify-start glass-button text-blue-400"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Company
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            ) : (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsAccountSelectorOpen(!isAccountSelectorOpen)}
                  className="glass-button h-10 w-10"
                  title={isCompanyMode ? 'Company Mode' : 'Personal Mode'}
                >
                  {isCompanyMode ? (
                    <Building2 className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
            
            {isCompanyMode && currentCompany && !isCollapsed && (
              <Badge variant="secondary" className="w-full justify-center mt-2">
                <Building2 className="h-3 w-3 mr-1" />
                {currentCompany.name}
              </Badge>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-3">
            <div className="space-y-2">
              {allMenuItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? "secondary" : "ghost"}
                  className={cn(
                    "w-full glass-button h-10",
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleProfileClick}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 p-0"
                    title="Go to Profile"
                  >
                    <span className="text-sm font-medium text-white">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </Button>
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleProfileClick}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 p-0"
                  title="Go to Profile"
                >
                  <span className="text-sm font-medium text-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </Button>
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

      {/* Create Company Modal */}
      <CreateCompanyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
