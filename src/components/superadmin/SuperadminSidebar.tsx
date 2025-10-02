'use client';

import { LogOut, Home, Building, Menu, ChevronDown, ChevronRight, Megaphone, Package, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';
import React from 'react';

interface SuperadminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const tabMapping: Record<string, { label: string; icon: React.ComponentType<{ className: string }>; children?: Record<string, { label: string; icon: React.ComponentType<{ className: string }> }> }> = {
  dashboard: { label: 'Dashboard', icon: Home },
  societies: { label: 'Societies', icon: Building },
  subscription: { label: 'Subscription', icon: Building },
  'ad-management': { 
    label: 'Ad Management', 
    icon: Megaphone,
    children: {
      'ad-packages': { label: 'Ad Packages', icon: Package },
      'placement-management': { label: 'Placement Management', icon: MapPin }
    }
  },
};

export default function SuperadminSidebar({
  activeTab,
  setActiveTab,
  handleLogout,
  isCollapsed,
  setIsCollapsed,
}: SuperadminSidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  return (
    <aside
      className={`bg-white shadow-sm flex flex-col justify-between h-full transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      role="navigation"
      aria-label="Superadmin Sidebar"
    >
      <div>
        <div className="flex items-center justify-between p-4">
          <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
            <Image src="/assets/waardian_ai_logo.svg" alt="Superadmin Logo" width={40} height={40} className="mx-auto" />
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <nav className="space-y-2 px-2">
          <TooltipProvider>
            {Object.entries(tabMapping).map(([tab, { label, icon: Icon, children }]) => (
              <div key={tab}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        if (children) {
                          setExpandedMenus(prev => ({ ...prev, [tab]: !prev[tab] }));
                        } else {
                          setActiveTab(tab);
                        }
                      }}
                      className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab || (children && Object.keys(children).some(child => activeTab === child))
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      aria-current={activeTab === tab ? 'page' : undefined}
                    >
                      <Icon className="w-5 h-5 min-w-[1.25rem]" />
                      {!isCollapsed && (
                        <>
                          <span className="ml-2 flex-1 text-left">{label}</span>
                          {children && (
                            expandedMenus[tab] ? 
                              <ChevronDown className="w-4 h-4" /> : 
                              <ChevronRight className="w-4 h-4" />
                          )}
                        </>
                      )}
                    </button>
                  </TooltipTrigger>
                  {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
                </Tooltip>
                
                {children && expandedMenus[tab] && !isCollapsed && (
                  <div className="ml-4 mt-2 space-y-1">
                    {Object.entries(children).map(([childTab, { label: childLabel, icon: ChildIcon }]) => (
                      <Tooltip key={childTab}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setActiveTab(childTab)}
                            className={`w-full flex items-center p-2 rounded-lg text-sm font-medium transition-all ${
                              activeTab === childTab ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                            aria-current={activeTab === childTab ? 'page' : undefined}
                          >
                            <ChildIcon className="w-4 h-4 min-w-[1rem]" />
                            <span className="ml-2">{childLabel}</span>
                          </button>
                        </TooltipTrigger>
                      </Tooltip>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </TooltipProvider>
        </nav>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className="w-full flex items-center p-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all mx-2 mb-2"
            >
              <LogOut className="w-5 h-5 min-w-[1.25rem]" />
              {!isCollapsed && <span className="ml-2">Logout</span>}
            </button>
          </TooltipTrigger>
          {isCollapsed && <TooltipContent side="right">Logout</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    </aside>
  );
}
