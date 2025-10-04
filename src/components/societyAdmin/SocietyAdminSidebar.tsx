'use client';

import { useState, useEffect } from 'react';
import {
  Home,
  Users,
  Building2,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  UserCheck,
  MessageSquare,
  Vote,
  CheckSquare,
  UserCog,
  DollarSign,
  FileText,
  Receipt,
  Truck,
  PiggyBank,
  BarChart3,
  CheckCircle,
  Brain,
  Folder,
  Bell,
  Calendar,
  Shield,
  Zap,
  Waves,
  Megaphone,
  Package,
  FileSignature,
  Headphones,
  Gift,
  Crown,
  AlertTriangle,
} from 'lucide-react';
import Image from 'next/image';

interface NavigationItem {
  id: string;
  label: string;
  icon: any;
  href?: string;
  isCategory?: boolean;
  children?: NavigationItem[];
  subcategories?: NavigationItem[];
}

interface SocietyAdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  user: {
    name: string;
    email: string;
    societyName?: string;
    [key: string]: any;
  };
}

const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/societyadmin',
    },
    {
      id: 'management',
      label: 'Management',
      icon: Users,
      isCategory: true,
      children: [
        {
          id: 'members',
          label: 'Member Management',
          icon: Users,
          href: '/societyadmin/members',
        },
        {
          id: 'staff',
          label: 'Staff Management',
          icon: UserCog,
          href: '/societyadmin/staff',
        },
        {
          id: 'visitors',
          label: 'Visitor Management',
          icon: UserCheck,
          href: '/societyadmin/visitor-management',
        },
        {
          id: 'amenity-management',
          label: 'Amenity Management',
          icon: Waves,
          href: '/societyadmin/amenity-management',
        },
        {
          id: 'notices',
          label: 'Notices & Alerts',
          icon: Bell,
          isCategory: true,
          children: [
            {
              id: 'notices-dashboard',
              label: 'Notice Dashboard',
              icon: BarChart3,
              href: '/societyadmin/notices-dashboard',
            },
            {
              id: 'notices-management',
              label: 'Notice Management',
              icon: Megaphone,
              href: '/societyadmin/notices-management',
            },
          ],
        },
        {
          id: 'polls',
          label: 'Voting & Polls',
          icon: Vote,
          href: '/societyadmin/polls',
        },
        {
          id: 'tasks',
          label: 'Task Scheduling',
          icon: Calendar,
          href: '/societyadmin/tasks',
        },
        {
          id: 'complaints',
          label: 'Complaint Resolution',
          icon: Headphones,
          href: '/societyadmin/complaints',
        },

      ],
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: DollarSign,
      isCategory: true,
      children: [
        {
          id: 'invoices-collections',
          label: 'Invoices & Collection',
          icon: FileText,
          isCategory: true,
          children: [
            {
              id: 'invoices-dashboard',
              label: 'Invoices Dashboard',
              icon: Receipt,
              href: '/societyadmin/invoices-dashboard',
            },
            {
              id: 'invoices-penalties',
              label: 'Invoices & Penalties',
              icon: AlertTriangle,
              href: '/societyadmin/invoices-penalties',
            },
          ],
        },

        {
          id: 'expenses',
          label: 'Expenses',
          icon: Receipt,
          isCategory: true,
          children: [
            {
              id: 'expense-dashboard',
              label: 'Expense Dashboard',
              icon: BarChart3,
              href: '/societyadmin/expense-dashboard',
            },
            {
              id: 'expense-management',
              label: 'Expense Management',
              icon: FileText,
              href: '/societyadmin/expense-management',
            },
          ],
        },
        {
          id: 'ledger',
          label: 'Ledger',
          icon: PiggyBank,
          isCategory: true,
          children: [
            {
              id: 'ledger-dashboard',
              label: 'Ledger Dashboard',
              icon: BarChart3,
              href: '/societyadmin/ledger-dashboard',
            },
            {
              id: 'ledger-management',
              label: 'Ledger Management',
              icon: FileText,
              href: '/societyadmin/ledger-management',
            },
          ],
        },
        {
          id: 'payment-gateway',
          label: 'Payment Gateway',
          icon: CreditCard,
          href: '/societyadmin/payment-gateway',
        },
      ],
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: Crown,
      href: '/societyadmin/billing',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/societyadmin/settings',
    },
  ];

export default function SocietyAdminSidebar({
  activeTab,
  setActiveTab,
  handleLogout,
  isCollapsed,
  setIsCollapsed,
  user,
}: SocietyAdminSidebarProps) {
  const [mounted, setMounted] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'management',
    'finance',
    'community', // Added to expand the new Community subcategory by default
    'invoices-collections',
    'expenses',
    'ledger',
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (!mounted) return null;

  return (
    <div className="h-full flex flex-col bg-white">
      <div className={`p-4 ${isCollapsed ? 'px-2' : ''}`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <Image
                src="/assets/waardian_ai_logo.svg"
                alt="Waardian Logo"
                width={32}
                height={32}
                className="rounded-md"
              />
              <div className="leading-tight">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  {user?.societyName || 'Waardian'}
                </h2>
                <p className="text-[11px] text-gray-500">
                  Powered by <span className="font-medium text-gray-700">Waardian</span>
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isExpanded = expandedCategories.includes(item.id);

          if (item.isCategory) {
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => !isCollapsed && toggleCategory(item.id)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-all duration-200 text-gray-700 hover:bg-gray-50 ${
                    isCollapsed ? 'justify-center px-2' : ''
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 text-gray-500" />
                  {!isCollapsed && (
                    <>
                      <span className="ml-3 font-medium">{item.label}</span>
                      <div className="ml-auto">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </>
                  )}
                </button>
                {!isCollapsed && isExpanded && item.children && (
                  <div className="ml-4 space-y-1">
                    {item.children
                      .filter((child) => child.id !== 'tasks' && child.id !== 'complaints')
                      .map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = activeTab === child.id;
                        const isChildCategory = child.isCategory;
                        const isChildExpanded = expandedCategories.includes(child.id);

                        if (isChildCategory) {
                          return (
                            <div key={child.id} className="space-y-1">
                              <button
                                onClick={() => toggleCategory(child.id)}
                                className="w-full flex items-center px-3 py-2 rounded-lg text-left transition-all duration-200 text-gray-600 hover:bg-gray-50"
                              >
                                <ChildIcon className="w-4 h-4 text-gray-400" />
                                <span className="ml-3 text-sm font-medium">{child.label}</span>
                                <div className="ml-auto">
                                  {isChildExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                              </button>
                              {isChildExpanded && child.children && (
                                <div className="ml-4 space-y-1">
                                  {child.children.map((subChild) => {
                                    const SubChildIcon = subChild.icon;
                                    const isSubChildActive = activeTab === subChild.id;

                                    return (
                                      <button
                                        key={subChild.id}
                                        onClick={() => setActiveTab(subChild.href?.split('/').pop() || subChild.id)}
                                        className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                                          isSubChildActive
                                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                      >
                                        <SubChildIcon
                                          className={`w-4 h-4 ${
                                            isSubChildActive ? 'text-blue-600' : 'text-gray-400'
                                          }`}
                                        />
                                        <span className="ml-3 text-sm font-medium">{subChild.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <button
                            key={child.id}
                            onClick={() => setActiveTab(child.href?.split('/').pop() || child.id)}
                            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                              isChildActive
                                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <ChildIcon className={`w-4 h-4 ${isChildActive ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className="ml-3 text-sm font-medium">{child.label}</span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.href?.split('/').pop() || item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              {!isCollapsed && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {!isCollapsed && user && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}