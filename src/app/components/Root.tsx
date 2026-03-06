import { Outlet } from 'react-router';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';

export default function Root() {
  return (
    // Outer: full-screen cream bg for desktop gutters
    <div className="min-h-screen bg-[#E5DFD5]">
      {/* Centered app shell — max-w-md on desktop, full-width on mobile */}
      <div className="relative w-full max-w-md mx-auto min-h-screen bg-[#F0EBE0] shadow-[0_0_48px_rgba(0,0,0,0.12)]">

        {/* Sticky top header */}
        <header className="sticky top-0 z-40 bg-[#F0EBE0] border-b border-black/[0.07]">
          <div className="flex items-center justify-center h-14 px-4">
            <Link
              to="/"
              className="font-gelica text-[22px] font-semibold tracking-wide text-[#1C1B1F]"
            >
              Wine Gallery
            </Link>
          </div>
        </header>

        {/* Page content — pb-20 leaves room for BottomNav */}
        <main className="pb-20">
          <Outlet />
        </main>

        {/* Bottom nav — contained within the centered shell */}
        <BottomNav />
      </div>
    </div>
  );
}
