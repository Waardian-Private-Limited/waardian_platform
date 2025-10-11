'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Menu, X } from 'lucide-react';

import { checkSession, logout } from '@/lib/superadmincontroller';
import { useUserStore } from '@/lib/store/userStore';

import SuperadminSidebar from '@/components/superadmin/SuperadminSidebar';
import SocietyAdminSidebar from '@/components/societyAdmin/SocietyAdminSidebar';
import SuperadminDashboard from '@/components/superadmin/SuperAdminDashboard';
import SuperadminSociety from '@/components/superadmin/SuperadminSociety';
import SocietyAdminDashboard from '@/components/societyAdmin/SocietyAdminDashboard';
import SuperadminSubscription from '@/components/superadmin/SuperAdminSubscription';
import AdPackages from '@/components/superadmin/AdPackages';
import PlacementManagement from '@/components/superadmin/PlacementManagement';
import OptedSubscriptions from '@/components/superadmin/OptedSubscriptions';
import HousingStructure from '@/components/societyAdmin/HousingStructure';
import MembersPage from '@/components/societyAdmin/MembersPage';
import BillingPage from '@/components/societyAdmin/BillingPage';
import InvoicesDashboard from '@/components/societyAdmin/InvoicesDashboard';
import InvoicesPenaltiesPage from '@/components/societyAdmin/InvoicesPenaltiesPage';
import VisitorManagement from '@/components/societyAdmin/VisitorManagement';
import PaymentGatewayPage from '@/components/societyAdmin/PaymentGateway';
import ExpenseDashboard from '@/components/societyAdmin/ExpenseDashboard';
import ExpenseManagement from '@/components/societyAdmin/ExpenseManagement';
import LedgerDashboard from '@/components/societyAdmin/LedgerDashboard';
import LedgerManagement from '@/components/societyAdmin/LedgerManagement';
import VotingDashboard from '@/components/societyAdmin/VotingDashboard';
import AmenityManagement from '@/components/societyAdmin/AmenityManagement';
import NoticeDashboard from '@/components/societyAdmin/NoticeDashboard';
import NoticeManagement from '@/components/societyAdmin/NoticeManagement';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import StaffDashboard from '@/components/societyAdmin/StaffDashboard';

export default function DynamicAdminPage() {
  const router = useRouter();
  const { slug } = useParams();
  const [isChecking, setIsChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { user, setUser, clearUser } = useUserStore();

  const baseRoute = Array.isArray(slug) ? slug[0]?.toLowerCase() : slug?.toLowerCase();
  const subRoute = Array.isArray(slug) && slug.length > 1 ? slug[1]?.toLowerCase() : null;

  const allowedBaseRoutes = ['superadmin', 'societyadmin'];
  const validTabs: Record<string, string[]> = {
    superadmin: ['dashboard', 'societies', 'subscription', 'ad-packages', 'placement-management', 'opted-subscriptions'],
    societyadmin: ['dashboard', 'members', 'flats', 'billing', 'settings', 'buildingstructure', 'invoices-dashboard', 'invoices-penalties', 'visitor-management', 'subscription', 'payment-gateway', 'expense-dashboard', 'expense-management', 'ledger-dashboard', 'ledger-management', 'amenity-management', 'polls', 'notices-dashboard', 'notices-management', 'staff'],
  };

  const redirectToLogin = useCallback((reason: string) => {
    if (!isRedirecting) {
      console.error('Redirecting to login due to:', reason);
      setIsRedirecting(true);
      clearUser();
      router.replace('/login');
    }
  }, [clearUser, router, isRedirecting]);

  useEffect(() => {
    let isMounted = true;

    // console.log('Route info:', { baseRoute, subRoute, validTabs, slug });

    if (!baseRoute || !allowedBaseRoutes.includes(baseRoute)) {
      redirectToLogin(`Invalid baseRoute: ${baseRoute}`);
      setIsChecking(false);
      return;
    }

    if (subRoute && !validTabs[baseRoute]?.includes(subRoute)) {
      redirectToLogin(`Invalid subRoute: ${subRoute} for baseRoute: ${baseRoute}`);
      setIsChecking(false);
      return;
    }

    const verifySession = async () => {
      try {
        const data = await checkSession();
        // console.log('Session data:', data);

        if (!isMounted) return;

        if (!data.isAuthenticated || data.role?.toLowerCase() !== baseRoute) {
          redirectToLogin(
            `Session invalid: isAuthenticated=${data.isAuthenticated}, role=${data.role}, expected=${baseRoute}`
          );
          return;
        }

        const userData = data.user || {};
        const newUser = {
          id: userData.id || 'user-1',
          role: data.role,
          email: userData.email || '',
          name: userData.name || '',
          societyId: userData.societyId || '1',
          societyName: userData.societyName || 'Your Society',
          avatar: userData.avatar || null,
        };
        setUser(newUser);
        // console.log('User set:', newUser);

        if (!newUser.societyId) {
          redirectToLogin('No societyId found in user data');
          return;
        }

        const defaultTab = validTabs[baseRoute][0];
        setActiveTab(subRoute && validTabs[baseRoute].includes(subRoute) ? subRoute : defaultTab);
        // console.log('Active tab set:', subRoute || defaultTab);
      } catch (error: any) {
        if (isMounted) {
          console.error('Session verification failed:', error.message);
          redirectToLogin(`Session error: ${error.message}`);
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [baseRoute, subRoute, setUser, redirectToLogin]);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarCollapsed(window.innerWidth < 1024);
      setIsMobileSidebarOpen(false);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      clearUser();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/login');
    }
  };

  const handleTabChange = (tab: string) => {
    // console.log('Changing tab to:', tab);
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
    router.push(`/${baseRoute}/${tab}`);
  };

  if (isChecking || !user) {
    // console.log('Rendering loading state:', { isChecking, user });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  let SidebarComponent: React.ComponentType<any> = () => null;
  let ContentComponent: React.ComponentType = () => (
    <div className="p-6 text-center text-red-600">
      <h2 className="text-xl font-semibold mb-2">Invalid Page</h2>
      <p>The requested page could not be found.</p>
    </div>
  );

  if (baseRoute === 'superadmin') {
    SidebarComponent = SuperadminSidebar;
    ContentComponent = () => {
      switch (activeTab) {
        case 'dashboard':
          return <SuperadminDashboard />;
        case 'societies':
          return <SuperadminSociety />;
        case 'subscription':
          return <SuperadminSubscription />;
        case 'opted-subscriptions':
          return <OptedSubscriptions />;
        case 'ad-packages':
          return <AdPackages />;
        case 'placement-management':
          return <PlacementManagement />;
        default:
          return <div>Select a tab</div>;
      }
    };
  } else if (baseRoute === 'societyadmin') {
    SidebarComponent = SocietyAdminSidebar;
    ContentComponent = () => {
      switch (activeTab) {
        case 'dashboard':
          return <SocietyAdminDashboard societyId={Number(user?.societyId) || 0} />;
        case 'members':
          return <MembersPage societyId={(user?.societyId || '0').toString()} />;
        case 'buildingstructure':
          return <HousingStructure societyId={(user?.societyId || '0').toString()} />;
        case 'billing':
          return <BillingPage societyId={(user?.societyId || '0').toString()} />;
        case 'subscription':
          return <BillingPage societyId={(user?.societyId || '0').toString()} />;
        case 'invoices-dashboard':
          return <InvoicesDashboard societyId={(user?.societyId || '0').toString()} />;
        case 'invoices-penalties':
          return <InvoicesPenaltiesPage societyId={(user?.societyId || '0').toString()} />;
        case 'visitor-management':
          return <VisitorManagement/>;
        case 'payment-gateway':
          return <PaymentGatewayPage/>;
        case 'expense-dashboard':
          return <ExpenseDashboard societyId={(user?.societyId || '0').toString()} />;
        case 'expense-management':
          return <ExpenseManagement 
            societyId={(user?.societyId || '0').toString()} 
            user={user ? { id: user.id, name: user.name, email: user.email } : undefined}
          />;
        case 'ledger-dashboard':
          return <LedgerDashboard societyId={(user?.societyId || '0').toString()} />;
        case 'ledger-management':
          return <LedgerManagement societyId={(user?.societyId || '0').toString()} />;
        case 'amenity-management':
          return <AmenityManagement societyId={(user?.societyId || '0').toString()} />;
        case 'polls':
          return <VotingDashboard societyId={(user?.societyId || '0').toString()} />;
        case 'notices-dashboard':
          return <NoticeDashboard societyId={(user?.societyId || '0').toString()} />;
        case 'notices-management':
          return <NoticeManagement societyId={(user?.societyId || '0').toString()} user={user} />;
        case 'staff':
          return <StaffDashboard societyId={(user?.societyId || '0').toString()} user={user} />;
        default:
          return <div>Select a tab</div>;
      }
    };
  }

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-gray-50">
        <aside
          className={`hidden lg:block bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          } flex-shrink-0`}
        >
          <div className="h-screen sticky top-0 overflow-y-auto">
            <SidebarComponent
              activeTab={activeTab}
              setActiveTab={handleTabChange}
              handleLogout={handleLogout}
              isCollapsed={isSidebarCollapsed}
              setIsCollapsed={setIsSidebarCollapsed}
              user={user}
            />
          </div>
        </aside>

        <div className="flex flex-col flex-1 min-w-0">
          <button
            className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-lg shadow-lg border border-gray-200"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
          </button>

          {isMobileSidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-64 z-50 bg-white shadow-lg overflow-y-auto">
                <SidebarComponent
                  activeTab={activeTab}
                  setActiveTab={handleTabChange}
                  handleLogout={handleLogout}
                  isCollapsed={false}
                  setIsCollapsed={setIsSidebarCollapsed}
                  user={user}
                />
              </aside>
            </>
          )}

          <Header user={user} handleLogout={handleLogout} />

          <main className="flex-1 p-4 lg:p-6 pb-20 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              <ContentComponent />
            </div>
          </main>

          {baseRoute !== 'superadmin' && <Footer user={user} />}
        </div>
      </div>
    </ErrorBoundary>
  );
}