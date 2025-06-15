
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
  User
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
  const { user, signOut } = useAuth();

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
          className="text-white bg-black/20 backdrop-blur-sm"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:transform-none",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full bg-black/20 backdrop-blur-lg border-r border-white/10">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-white/10">
            <Battery className="h-8 w-8 text-blue-400 mr-3" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ReVolt
            </span>
          </div>

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
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center mb-3 px-2">
              <User className="h-5 w-5 text-slate-400 mr-3" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
