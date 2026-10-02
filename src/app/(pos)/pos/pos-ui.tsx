'use client';

import { X } from 'lucide-react';
import { ReactNode } from 'react';

const posControl = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
export const posButton = posControl + ' border-zinc-200 hover:bg-zinc-50';
export const posPrimary = posControl + ' border-indigo-800 bg-indigo-800 text-white hover:bg-indigo-900';
export const posInput = 'min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100';

export function PosModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/40 p-3">
    <section role="dialog" aria-modal="true" aria-label={title} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
      <header className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">{title}</h2>
        <button aria-label="إغلاق" onClick={onClose} className={posButton}><X size={18}/></button></header>
      {children}
    </section>
  </div>;
}
