import Link from 'next/link';
import { SearchX, Home, UtensilsCrossed } from 'lucide-react';

export default function StorefrontNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-amber-500 mb-6 shadow-xl">
        <SearchX className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-white sm:text-4xl">404</h1>
      <p className="mt-2 text-base font-semibold text-zinc-300">
        الصفحة أو الطلب الذي تبحث عنه غير موجود
      </p>
      <p className="text-xs text-zinc-500 mt-1">
        The page or order reference you are looking for could not be found.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-white/10 transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>الرئيسية / Home</span>
        </Link>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity"
        >
          <UtensilsCrossed className="h-4 w-4" />
          <span>قائمة الطعام / Menu</span>
        </Link>
      </div>
    </div>
  );
}
