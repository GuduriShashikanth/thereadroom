'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200">
      <nav className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="The Read Room"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="text-lg font-bold text-slate-900">
              The Read Room
            </span>
          </Link>

          {/* Simple Nav */}
          <Link 
            href="/" 
            className="text-slate-600 hover:text-slate-900 text-sm font-medium"
          >
            Home
          </Link>
        </div>
      </nav>
    </header>
  );
}

