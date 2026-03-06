import { Outlet, Link } from 'react-router';
import { Menu, Search } from 'lucide-react';
import { NavigationTabs } from './NavigationTabs';

export default function Root() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Global sticky header */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-30 h-[52px] flex items-center px-4">
        <button className="w-8 h-8 flex items-center justify-center text-neutral-700">
          <Menu size={22} />
        </button>
        <Link to="/" className="flex-1 text-center text-[17px] font-bold text-neutral-900 tracking-tight">
          Wine Gallery
        </Link>
        <button className="w-8 h-8 flex items-center justify-center text-neutral-700">
          <Search size={22} />
        </button>
      </header>

      {/* Navigation tabs */}
      <NavigationTabs />

      {/* Page content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
