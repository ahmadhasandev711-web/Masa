'use client';

import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { switchActiveBranchAction } from '../../actions/branch.actions';

interface BranchOption {
  id: string;
  code: string;
  nameAr: string;
}

interface BranchSwitcherProps {
  branches: BranchOption[];
  activeBranchId: string | null;
  canSwitchBranches?: boolean;
}

export function BranchSwitcher({
  branches,
  activeBranchId,
  canSwitchBranches = true,
}: BranchSwitcherProps) {
  const [prevActiveBranchId, setPrevActiveBranchId] = useState(activeBranchId);
  const [selectedId, setSelectedId] = useState<string | null>(activeBranchId);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (activeBranchId !== prevActiveBranchId) {
    setPrevActiveBranchId(activeBranchId);
    setSelectedId(activeBranchId);
  }

  const activeBranch = branches.find((b) => b.id === selectedId) ?? branches[0] ?? null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectBranch = async (branchId: string) => {
    if (branchId === selectedId) {
      setIsOpen(false);
      return;
    }

    setIsPending(true);
    setSelectedId(branchId);
    setIsOpen(false);

    try {
      const res = await switchActiveBranchAction(branchId);
      if (!res.success) {
        setSelectedId(activeBranchId);
      }
    } catch {
      setSelectedId(activeBranchId);
    } finally {
      setIsPending(false);
    }
  };

  if (branches.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
        <Building2 className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
        <span>لا يوجد فروع نشطة</span>
      </div>
    );
  }

  // Branch Scoping: If user is branch-restricted, show a static locked badge with no switcher dropdown
  if (!canSwitchBranches || branches.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-700">
        <Building2 className="w-4 h-4 text-zinc-500" strokeWidth={1.75} />
        <span className="text-zinc-500">الفرع:</span>
        <span className="font-semibold text-zinc-900">
          {activeBranch ? `${activeBranch.nameAr} (${activeBranch.code})` : 'الفرع المحدد'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isPending}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-medium text-zinc-700 transition-colors shadow-2xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
      >
        <Building2 className="w-4 h-4 text-zinc-500" strokeWidth={1.75} />
        <span className="text-zinc-500">الفرع النشط:</span>
        <span className="font-semibold text-zinc-900">
          {activeBranch ? `${activeBranch.nameAr} (${activeBranch.code})` : 'اختر الفرع'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-2 border-b border-zinc-100 text-zinc-500 font-medium">
            تبديل نطاق العمل الميداني
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {branches.map((branch) => {
              const isSelected = branch.id === activeBranch?.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => handleSelectBranch(branch.id)}
                  className={`w-full text-right px-3 py-2 flex items-center justify-between hover:bg-zinc-50 transition-colors ${
                    isSelected ? 'bg-zinc-50 text-zinc-900 font-semibold' : 'text-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
                      {branch.code}
                    </span>
                    <span className="truncate">{branch.nameAr}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
