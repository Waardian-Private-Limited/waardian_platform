'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, User, Check, Clock, ShieldAlert, FileText, CheckCircle2, MoreVertical, X } from 'lucide-react';
import Image from 'next/image';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount, Notification } from '@/lib/notificationClient';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  user: {
    id: string;
    role: string;
    email: string;
    name: string;
    societyName?: string;
    avatar?: string;
  } | null;
  handleLogout: () => void;
}

export default function Header({ user, handleLogout }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotificationData = async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadCount()
      ]);
      if (notifsRes.success) setNotifications(notifsRes.data);
      if (countRes.success) setUnreadCount(countRes.data.count);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotificationData();
    const interval = setInterval(fetchNotificationData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id);
      fetchNotificationData();
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      fetchNotificationData();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30 h-16">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left Section - Logo and Society Name */}
        <div className="flex items-center space-x-3">
          <div className="leading-tight">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900">
              {user?.societyName || 'Admin Portal'}
            </h1>
          </div>
        </div>

        {/* Right Section - Notifications and User Menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 min-w-[16px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                      <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                        >
                          Mark all as read
                        </button>
                        <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                           <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center">
                          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell className="w-6 h-6 text-gray-300" />
                          </div>
                          <p className="text-sm text-gray-500">Everything caught up!</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => handleMarkRead(notif.id)}
                              className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer group flex gap-3 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                  <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                    {notif.title}
                                  </p>
                                  {!notif.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>}
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{notif.body}</p>
                                <span className="text-[10px] text-gray-400 mt-2 block font-medium">
                                  {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button className="w-full py-3 bg-gray-50 text-[11px] font-bold text-gray-500 hover:text-gray-700 border-t border-gray-100 uppercase tracking-widest transition-colors">
                      View all activities
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
            >
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={34}
                  height={34}
                  className="rounded-full shadow-sm"
                />
              ) : (
                <div className="w-[34px] h-[34px] bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-100">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{user?.role}</p>
              </div>
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors font-medium">
                        Profile Settings
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold mt-1"
                      >
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
