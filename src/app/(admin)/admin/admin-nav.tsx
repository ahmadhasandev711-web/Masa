'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  UtensilsCrossed,
  ShoppingBag,
  Package,
  Wallet,
  Settings,
  Store,
  Contact,
  BarChart3,
  Armchair,
  LayoutGrid,
  ChefHat,
  Receipt,
  CalendarCheck,
  LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  Users,
  UtensilsCrossed,
  ShoppingBag,
  Package,
  Wallet,
  Settings,
  Store,
  Contact,
  BarChart3,
  Armchair,
  LayoutGrid,
  ChefHat,
  Receipt,
  CalendarCheck,
};

export interface AdminNavItem {
  label: string;
  href: string;
  iconName: string;
  badge?: string | number | null;
  badgeColor?: 'zinc' | 'emerald' | 'rose' | 'amber' | 'blue';
}

export interface AdminNavSection {
  title?: string;
  items: AdminNavItem[];
}

interface AdminNavProps {
  sections?: AdminNavSection[];
  items?: AdminNavItem[];
  onItemClick?: () => void;
  className?: string;
}

export function AdminNav({ sections, items, onItemClick, className }: AdminNavProps) {
  const pathname = usePathname();

  // Normalize sections (backwards-compatible with flat items)
  const effectiveSections: AdminNavSection[] = sections
    ? sections
    : items
    ? [{ items }]
    : [];

  return (
    <nav className={className || 'space-y-4'}>
      {effectiveSections.map((section, sIdx) => (
        <div key={section.title || `section-${sIdx}`} className="space-y-1">
          {section.title && (
            <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-zinc-400 select-none tracking-wider">
              {section.title}
            </div>
          )}

          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={`group flex min-h-10 shrink-0 items-center justify-between rounded-xl px-3 py-2 text-xs md:w-full transition-all ${
                    isActive
                      ? 'bg-zinc-900 text-white font-bold shadow-2xs'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`size-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-zinc-400 group-hover:text-zinc-700'
                      }`}
                      strokeWidth={isActive ? 2 : 1.75}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge !== undefined && item.badge !== null && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          item.badgeColor === 'rose'
                            ? isActive
                              ? 'bg-rose-500 text-white'
                              : 'bg-rose-50 border border-rose-200 text-rose-700 font-black animate-pulse'
                            : isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <span className="size-1.5 rounded-full bg-emerald-400 md:hidden" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
