'use client';

import { LogOut, Users, Home, Menu, Building } from 'lucide-react';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SocietyAdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const tabMapping: Record<
  string,
  { label: string; icon: React.ComponentType<{ className: string }> }
> = {
  dashboard: { label: 'Dashboard', icon: Home },
  members: { label: 'Members', icon: Users },
  HousingStructure: { label: 'Housing Structure', icon: Building },
};

export default function SocietyAdminSidebar({
  activeTab,
  setActiveTab,
  handleLogout,
  isCollapsed,
  setIsCollapsed,
}: SocietyAdminSidebarProps) {
  return (
    <aside
      className={`bg-black text-white flex flex-col justify-between transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } h-full overflow-y-auto shadow-lg`}
    >
      <div className="flex flex-col flex-grow">
        {/* Top Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Image
                src="/assets/waardian_ai_logo.svg"
                alt="Logo"
                width={36}
                height={36}
                className="rounded bg-white p-1"
              />
              <span className="text-white font-semibold text-lg">Waardian</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-400 hover:bg-gray-800 rounded"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1 flex-1 overflow-auto">
          <TooltipProvider>
            {Object.entries(tabMapping).map(([tab, { label, icon: Icon }]) => (
              <Tooltip key={tab} delayDuration={100}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab(tab)}
                    className={`w-full flex items-center p-3 rounded-lg text-sm transition ${
                      activeTab === tab
                        ? 'bg-white text-black font-semibold'
                        : 'text-white hover:bg-gray-800'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    {!isCollapsed && <span className="ml-3">{label}</span>}
                  </button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">{label}</TooltipContent>
                )}
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>
      </div>

      {/* Logout */}
      <TooltipProvider>
        <div className="p-2 border-t border-gray-800">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center p-3 text-sm text-white hover:bg-red-600 rounded-lg transition ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
                {!isCollapsed && <span className="ml-3">Logout</span>}
              </button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Logout</TooltipContent>}
          </Tooltip>
        </div>
      </TooltipProvider>
    </aside>
  );
}
