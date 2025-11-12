import { Menu } from "lucide-react";
import { KediLogo } from "./KediLogo";

interface TopBarProps {
  onMenuClick?: (menu: string) => void;
  activeMenu?: string;
  onSettingsClick?: () => void;
  showLogo?: boolean;
  showHome?: boolean;
  showSeries?: boolean;
  showMovies?: boolean;
  showLive?: boolean;
  showRadio?: boolean;
}

export function TopBar({ 
  onMenuClick, 
  activeMenu = "home", 
  onSettingsClick, 
  showLogo = true,
  showHome = true,
  showSeries = true,
  showMovies = true,
  showLive = true,
  showRadio = true
}: TopBarProps) {
  const allMenuItems = [
    { id: "home", label: "Home", show: showHome },
    { id: "series", label: "Series", show: showSeries },
    { id: "movies", label: "Movies", show: showMovies },
    { id: "youtube", label: "YouTube", show: true },
    { id: "tv", label: "Live", show: showLive },
    { id: "radio", label: "Radio", show: showRadio },
  ];
  
  const menuItems = allMenuItems.filter(item => item.show);

  return (
    <div className="fixed left-0 right-0 top-0 z-50 bg-gradient-to-b from-black to-transparent">
      <div className="flex h-32 items-center justify-between px-12 transition-colors">
        {/* Logo and Navigation */}
        <div className="flex items-center gap-16">
          {showLogo && (
            <h1 className="text-2xl text-[var(--netflix-red)] font-bold flex items-center gap-2">
              <KediLogo className="h-10 w-10" /> Kedi
            </h1>
          )}
          
          {/* Navigation Menu */}
          <nav className="hidden items-center gap-12 md:flex">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onMenuClick?.(item.id)}
                className={`text-2xl cursor-pointer transition-colors hover:text-white ${
                  activeMenu === item.id ? "text-white" : "text-white/70"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6">
          <button
            onClick={onSettingsClick}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Settings"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
