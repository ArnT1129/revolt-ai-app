
import { Link, useLocation } from "react-router-dom";
import { BatteryCharging, Home, Upload, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Upload Data", href: "/upload", icon: Upload },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col grow gap-y-5 overflow-y-auto bg-card px-6 pb-4 border-r border-border">
        <div className="flex h-16 shrink-0 items-center gap-2">
          <BatteryCharging className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-primary">ReVolt</span>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        location.pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "hover:text-primary hover:bg-accent",
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                      )}
                    >
                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
