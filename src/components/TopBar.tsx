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
      <div className="flex items-center justify-between gap-2 p-6 md:h-32 md:gap-16 md:px-12 md:py-4 transition-colors">
        {/* Logo */}
        {showLogo && (
          <h1 className="text-2xl text-[var(--netflix-red)] font-bold flex items-center gap-2 flex-shrink-0">
            <KediLogo className="h-8 w-8 md:h-10 md:w-10" />
            <span className="hidden md:inline">Kedi</span>
          </h1>
        )}

        {/* Navigation Menu - Horizontal scrollable */}
        <nav className="flex items-center gap-3 md:gap-12 overflow-x-auto scrollbar-hide flex-1 min-w-0">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onMenuClick?.(item.id)}
              className={`text-base md:text-2xl cursor-pointer transition-colors hover:text-white whitespace-nowrap flex-shrink-0 ${
                activeMenu === item.id ? "text-white" : "text-white/70"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Settings Button */}
        <button
          onClick={onSettingsClick}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 border-white/20 border-1"
          title="Settings"
        >
          <Menu className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>
    </div>
  );
}
