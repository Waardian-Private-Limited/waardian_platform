// pages/admin/[...slug]/page.tsx
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { checkSession, logout } from '@/lib/superadmincontroller';
import SuperadminSidebar from '@/components/superadmin/SuperadminSidebar';
import SocietyAdminSidebar from '@/components/societyAdmin/SocietyAdminSidebar';
import SuperadminDashboard from '@/components/superadmin/SuperAdminDashboard';
import SuperadminSociety from '@/components/superadmin/SuperadminSociety';
import SocietyAdminDashboard from '@/components/societyAdmin/SocietyAdminDashboard';
import MembersPage from '@/components/societyAdmin/MembersPage';
import FeaturesExplore from '@/components/societyAdmin/HousingStructure';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function DynamicAdminPage() {
  const router = useRouter();
  const { slug } = useParams();
  const [isChecking, setIsChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);

  const baseRoute = Array.isArray(slug) ? slug[0]?.toLowerCase() : slug?.toLowerCase();
  const subRoute = Array.isArray(slug) && slug.length > 1 ? slug[1]?.toLowerCase() : null;

  useEffect(() => {
    const verifySession = async () => {
      try {
        const data = await checkSession();
        if (!data.isAuthenticated || data.role?.toLowerCase() !== baseRoute) {
          router.push('/login');
        } else {
          setUser({ role: data.role, email: data.email || 'admin@example.com' });
          if (subRoute && ['dashboard', 'members', 'HousingStructure', 'societies'].includes(subRoute)) {
            setActiveTab(subRoute);
          }
        }
      } catch {
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    };

    if (baseRoute === 'superadmin' || baseRoute === 'societyadmin') {
      verifySession();
    } else {
      router.push('/login');
      setIsChecking(false);
    }
  }, [router, baseRoute, subRoute]);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarCollapsed(window.innerWidth < 768);
      setIsMobileSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  let SidebarComponent: React.ComponentType<any> = () => null;
  let ContentComponent: React.ComponentType = () => (
    <div className="p-4 text-red-600">Invalid tab</div>
  );

  if (baseRoute === 'superadmin') {
    SidebarComponent = SuperadminSidebar;
    ContentComponent =
      activeTab === 'dashboard'
        ? SuperadminDashboard
        : activeTab === 'societies'
        ? SuperadminSociety
        : ContentComponent;
  } else if (baseRoute === 'societyadmin') {
    SidebarComponent = SocietyAdminSidebar;
    ContentComponent =
      activeTab === 'dashboard'
        ? SocietyAdminDashboard
        : activeTab === 'members'
        ? MembersPage
        : activeTab === 'HousingStructure'
        ? FeaturesExplore
        : ContentComponent;
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-[#f8f9fc] text-gray-900">
        <Header user={user} handleLogout={handleLogout} />

        <div className="flex flex-1 relative overflow-hidden">
          {/* Mobile Sidebar Toggle */}
          <button
            className="md:hidden p-2 absolute top-4 left-4 z-20 bg-white rounded-md shadow-sm"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>

          {/* Sidebar */}
          <aside
            className={`bg-[#f1f3f9] border-r border-gray-200 ${
              isSidebarCollapsed ? 'w-16' : 'w-64'
            } hidden md:block transition-all duration-300 sticky top-0 h-[calc(100vh-4rem)] overflow-y-auto z-10`}
          >
            <SidebarComponent
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              handleLogout={handleLogout}
              isCollapsed={isSidebarCollapsed}
              setIsCollapsed={setIsSidebarCollapsed}
            />
          </aside>

          {/* Mobile Sidebar */}
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-30 bg-[#f1f3f9] md:hidden">
              <SidebarComponent
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleLogout={handleLogout}
                isCollapsed={false}
                setIsCollapsed={setIsSidebarCollapsed}
              />
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-y-auto">
            <div className="flex-1 px-4 py-6 md:px-6">
              <ContentComponent />
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
