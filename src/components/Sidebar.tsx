
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Battery, 
  Upload, 
  Settings, 
  BarChart3, 
  Menu,
  X,
  LogOut,
  User,
  FlaskConical
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, signOut, isDemo } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-600 bg-white/80 backdrop-blur-sm border border-slate-200"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:transform-none",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full bg-white/90 backdrop-blur-lg border-r border-slate-200">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-slate-200">
            <img 
              src="/placeholder.svg" 
              alt="Logo" 
              className="h-8 w-8 mr-3"
            />
            <span className="text-xl font-bold text-slate-800">
              Battery Analytics
            </span>
          </div>

          {/* Demo Mode Banner */}
          {isDemo && (
            <div className="mx-4 mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center">
                <FlaskConical className="h-4 w-4 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-orange-800">Demo Mode</span>
              </div>
              <p className="text-xs text-orange-600 mt-1">
                You're viewing sample data
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center mb-3 px-2">
              <User className="h-5 w-5 text-slate-400 mr-3" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            >
              <LogOut className="mr-3 h-4 w-4" />
              {isDemo ? 'Exit Demo' : 'Sign Out'}
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
