'use client';

import React, { useState } from 'react';
import { User, UserRole, CurrencyCode, Notification } from '@/lib/travel-system/types';
import {
  Compass,
  LayoutDashboard,
  Code2,
  Database,
  Bell,
  RotateCcw,
  Check,
  ChevronDown,
  Globe,
  Coins,
  Shield,
  UserCheck,
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  activeTab: 'MARKETPLACE' | 'OPERATIONS' | 'API_DOCS' | 'ARCHITECTURE';
  onSelectTab: (tab: 'MARKETPLACE' | 'OPERATIONS' | 'API_DOCS' | 'ARCHITECTURE') => void;
  currency: CurrencyCode;
  onSelectCurrency: (c: CurrencyCode) => void;
  lang: 'id' | 'en';
  onToggleLang: () => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onResetData: () => void;
}

export function Navbar({
  currentRole,
  currentUser,
  allUsers,
  onSelectUser,
  activeTab,
  onSelectTab,
  currency,
  onSelectCurrency,
  lang,
  onToggleLang,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onResetData,
}: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.isRead);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onSelectTab('MARKETPLACE')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
              <Compass className="w-5 h-5 animate-pulse text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-900">
                  Nusantara<span className="text-blue-600">Travel</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                  Enterprise TMS v1.0
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Advanced Backend & Concurrency Engine
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 backdrop-blur-md shadow-inner">
            <button
              onClick={() => onSelectTab('MARKETPLACE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === 'MARKETPLACE'
                  ? 'bg-white text-blue-700 shadow-md glow-blue scale-102'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Compass className="w-4 h-4 text-blue-600" />
              <span>{lang === 'id' ? 'Eksplor & Booking' : 'Marketplace'}</span>
            </button>

            <button
              onClick={() => onSelectTab('OPERATIONS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === 'OPERATIONS'
                  ? 'bg-white text-blue-700 shadow-md glow-blue scale-102'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-600" />
              <span>{lang === 'id' ? 'Dashboard Operasional' : 'Operations Desk'}</span>
            </button>

            <button
              onClick={() => onSelectTab('API_DOCS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === 'API_DOCS'
                  ? 'bg-white text-blue-700 shadow-md glow-blue scale-102'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Code2 className="w-4 h-4 text-emerald-600" />
              <span>OpenAPI / Swagger</span>
            </button>

            <button
              onClick={() => onSelectTab('ARCHITECTURE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === 'ARCHITECTURE'
                  ? 'bg-white text-blue-700 shadow-md glow-blue scale-102'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Database className="w-4 h-4 text-purple-600" />
              <span>Architecture & ERD</span>
            </button>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Currency Selector */}
            <div className="relative">
              <button
                onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
              >
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>{currency}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showCurrencyMenu && (
                <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white p-1.5 shadow-xl border border-slate-200 z-50 text-xs">
                  {(['IDR', 'USD', 'SGD', 'MYR'] as CurrencyCode[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        onSelectCurrency(c);
                        setShowCurrencyMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition ${
                        currency === c ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{c}</span>
                      {currency === c && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Toggle */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
              title="Toggle Language (ID/EN)"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold uppercase">{lang}</span>
            </button>

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white p-3 shadow-2xl border border-slate-200 z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span className="text-xs font-bold text-slate-900">Event Notifications</span>
                    {unreadNotifs.length > 0 && (
                      <button
                        onClick={onMarkAllNotificationsRead}
                        className="text-[11px] text-blue-600 hover:underline font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">No notifications</div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => onMarkNotificationRead(n.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                            n.isRead ? 'bg-white border-slate-100 text-slate-600' : 'bg-blue-50/70 border-blue-100 text-slate-900 font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-semibold uppercase text-blue-600">{n.type}</span>
                            <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="font-semibold text-slate-900 text-xs mb-0.5">{n.title}</div>
                          <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role / User Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              >
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.role === 'ADMIN' ? (
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                  ) : currentUser.role === 'STAFF' ? (
                    <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                  ) : (
                    currentUser.fullName.charAt(0)
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        currentUser.role === 'ADMIN'
                          ? 'bg-amber-500'
                          : currentUser.role === 'STAFF'
                          ? 'bg-sky-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Test Persona / Role
                  </div>
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u);
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                        currentUser.id === u.id ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">{u.fullName}</div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-100 text-amber-800'
                            : u.role === 'STAFF'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Reset State Button */}
            <button
              onClick={() => {
                if (confirm('Reset store data back to clean realistic Indonesian seed dataset?')) {
                  onResetData();
                }
              }}
              title="Reset Demo Data"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Nav Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => onSelectTab('MARKETPLACE')}
            className={`flex items-center gap-1 py-1 px-2 rounded-md ${
              activeTab === 'MARKETPLACE' ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Market</span>
          </button>
          <button
            onClick={() => onSelectTab('OPERATIONS')}
            className={`flex items-center gap-1 py-1 px-2 rounded-md ${
              activeTab === 'OPERATIONS' ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Ops Desk</span>
          </button>
          <button
            onClick={() => onSelectTab('API_DOCS')}
            className={`flex items-center gap-1 py-1 px-2 rounded-md ${
              activeTab === 'API_DOCS' ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>API</span>
          </button>
          <button
            onClick={() => onSelectTab('ARCHITECTURE')}
            className={`flex items-center gap-1 py-1 px-2 rounded-md ${
              activeTab === 'ARCHITECTURE' ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>ERD</span>
          </button>
        </div>
      </div>
    </header>
  );
}
