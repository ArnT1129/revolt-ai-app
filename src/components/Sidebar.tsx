
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, BarChart3, GitCompare, Download, Settings, Upload, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import QuickActions from "./QuickActions";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Create Passport", href: "/upload", icon: Upload },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 bg-black/20 backdrop-blur-sm border-r border-white/10 flex flex-col`}>
      {/* Logo and Toggle */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/4da0f652-00c2-4e71-acf9-94d61337be25.png" 
                alt="ReVolt" 
                className="h-8 w-auto"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:bg-white/10"
          >
            {isCollapsed ? "→" : "←"}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <Link key={item.name} to={item.href}>
            <Button
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className={`w-full justify-start glass-button transition-all duration-200 ${
                isActive(item.href) 
                  ? "bg-blue-500/20 border-blue-400/50 text-white shadow-lg shadow-blue-500/25" 
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">{item.name}</span>}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Quick Actions - only show when not collapsed */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/10">
          <QuickActions />
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        {!isCollapsed && (
          <p className="text-xs text-slate-400 text-center">
            Battery Intelligence Platform
          </p>
        )}
      </div>
    </aside>
  );
}
