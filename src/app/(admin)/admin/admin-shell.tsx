'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Store,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Building2,
} from 'lucide-react';
import { AdminNav, AdminNavItem, AdminNavSection, ICON_MAP } from './admin-nav';
import { BranchSwitcher } from './branch-switcher';

interface AdminShellProps {
  restaurantNameAr: string;
  restaurantNameEn: string;
  currency: string;
  currencySymbol: string;
  branches: Array<{ id: string; code: string; nameAr: string }>;
  activeBranchId: string | null;
  canSwitchBranches: boolean;
  displayName: string;
  roleName: string;
  visibleNavItems?: AdminNavItem[];
  navSections?: AdminNavSection[];
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}

export function AdminShell({
  restaurantNameAr,
  restaurantNameEn,
  currency,
  currencySymbol,
  branches,
  activeBranchId,
  canSwitchBranches,
  displayName,
  roleName,
  visibleNavItems,
  navSections,
  logoutAction,
  children,
}: AdminShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  const activeBranch = branches.find((b) => b.id === activeBranchId) ?? branches[0] ?? null;

  // Render standalone full-screen layout for Kitchen KDS without white sidebar
  if (pathname === '/admin/kitchen') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-zinc-950 flex flex-col font-sans" dir="rtl">
        {children}
      </div>
    );
  }

  const effectiveSections =
    navSections && navSections.length > 0
      ? navSections
      : visibleNavItems
      ? [{ items: visibleNavItems }]
      : [];

  const allNavItems = visibleNavItems || effectiveSections.flatMap((s) => s.items);

  // Determine current active section for mobile header indicator
  const currentNavItem =
    allNavItems.find((item) =>
      item.href === '/admin'
        ? pathname === '/admin'
        : pathname === item.href || pathname.startsWith(item.href + '/')
    ) ?? allNavItems[0];

  const CurrentIcon = currentNavItem ? (ICON_MAP[currentNavItem.iconName] || LayoutDashboard) : LayoutDashboard;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900 md:flex-row" dir="rtl">
      {/* 1. Mobile Top App Bar (Sleek, Clean, Shows exactly where the user is) */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-200 bg-white/95 px-3.5 shadow-2xs backdrop-blur-md md:hidden">
        {/* Right side: Drawer Toggle Button + Current Page Title & Icon */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="فتح القائمة الرئيسية"
            className="grid size-9 place-items-center rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 active:scale-95 transition"
          >
            <Menu className="size-4" strokeWidth={1.8} />
          </button>

          {/* Active Screen Indicator */}
          <div className="flex items-center gap-2 rounded-lg bg-zinc-100/80 px-2.5 py-1 text-xs font-bold text-zinc-900">
            <CurrentIcon className="size-3.5 text-zinc-800" strokeWidth={2} />
            <span className="truncate max-w-[130px] sm:max-w-xs">{currentNavItem?.label ?? 'لوحة التحكم'}</span>
          </div>
        </div>

        {/* Left side: Branch code pill + User Avatar */}
        <div className="flex items-center gap-2">
          {activeBranch && (
            <span className="flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-mono font-medium text-zinc-700">
              <Building2 className="size-3 text-zinc-500" />
              <span>{activeBranch.code}</span>
            </span>
          )}
          <div className="grid size-8 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white shadow-2xs">
            {displayName.slice(0, 1)}
          </div>
        </div>
      </header>

      {/* 2. Mobile Slide-Over Drawer (Side Dashboard for Phones/Tablets) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop blur overlay */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
          />

          {/* Sliding Drawer Container */}
          <aside className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col justify-between bg-white shadow-2xl transition-transform duration-200 animate-in slide-in-from-right">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded-lg bg-zinc-900 text-white font-bold">
                    <Store className="size-4 text-zinc-100" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 leading-tight">
                      {restaurantNameAr}
                    </h2>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {restaurantNameEn}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="إغلاق القائمة"
                  className="grid size-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Branch Switcher & User Profile in Mobile Drawer */}
              <div className="border-b border-zinc-100 bg-zinc-50/70 p-3.5 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-8 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                    {displayName.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="truncate text-xs font-bold text-zinc-900">{displayName}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{roleName}</p>
                  </div>
                </div>

                <div className="pt-1">
                  <BranchSwitcher
                    branches={branches}
                    activeBranchId={activeBranchId}
                    canSwitchBranches={canSwitchBranches}
                  />
                </div>
              </div>

              {/* Navigation Links inside Drawer */}
              <div className="max-h-[55vh] overflow-y-auto p-2">
                <AdminNav
                  sections={effectiveSections}
                  className="space-y-4"
                  onItemClick={() => setIsDrawerOpen(false)}
                />
              </div>
            </div>

            {/* Mobile Drawer Footer with Logout */}
            <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>العملة: {currency} ({currencySymbol})</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                  نشط
                </span>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition shadow-2xs"
                >
                  <LogOut className="size-3.5" />
                  <span>تسجيل الخروج</span>
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* 3. Desktop Permanent Sidebar (Hidden on mobile, pristine on desktop) */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:justify-between border-l border-zinc-200 bg-white shadow-xs h-screen sticky top-0">
        <div className="flex flex-col h-[calc(100vh-65px)]">
          {/* Brand Header */}
          <div className="flex items-center gap-3 border-b border-zinc-100 p-4 shrink-0">
            <div className="grid size-10 place-items-center rounded-xl bg-zinc-900 text-white font-bold shadow-2xs">
              <Store className="size-5 text-zinc-100" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-sm text-zinc-900 leading-tight truncate">
                {restaurantNameAr}
              </h1>
              <span className="text-[11px] text-zinc-500 font-mono block truncate">
                {restaurantNameEn}
              </span>
            </div>
          </div>

          {/* Navigation Items with Grouped Sections */}
          <div className="p-3 overflow-y-auto flex-1">
            <AdminNav sections={effectiveSections} className="space-y-4" />
          </div>
        </div>

        {/* Desktop Sidebar Footer */}
        <div className="border-t border-zinc-100 bg-zinc-50/60 p-3.5 shrink-0">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>
              العملة: {currency} ({currencySymbol})
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>متصل</span>
            </span>
          </div>
        </div>
      </aside>

      {/* 4. Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Desktop Top Header (Hidden on mobile) */}
        <header className="hidden md:flex h-16 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 shadow-2xs">
          <div className="flex items-center gap-4">
            <BranchSwitcher
              branches={branches}
              activeBranchId={activeBranchId}
              canSwitchBranches={canSwitchBranches}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white">
              {displayName.slice(0, 1)}
            </div>
            <div className="text-xs text-right">
              <p className="font-medium text-zinc-900">{displayName}</p>
              <p className="text-zinc-500 font-mono text-[10px]">{roleName}</p>
            </div>
            <form action={logoutAction}>
              <button
                aria-label="تسجيل الخروج"
                title="تسجيل الخروج"
                className="grid size-9 place-items-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-7xl flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
