import { Outlet } from 'react-router';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';

/** Wine Gallery arch icon — inline SVG */
function WineGalleryIcon({ size = 30 }: { size?: number }) {
  const h = Math.round(size * 1.22);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 36 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <clipPath id="wg-arch-clip">
          <path d="M2 43V18C2 9.163 9.163 2 18 2C26.837 2 34 9.163 34 18V43H2Z" />
        </clipPath>
      </defs>

      {/* Lattice lines — clipped to arch shape */}
      <g clipPath="url(#wg-arch-clip)" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        {/* \ direction */}
        <line x1="-2" y1="4"  x2="30" y2="44" />
        <line x1="8"  y1="-2" x2="40" y2="32" />
        <line x1="-12" y1="14" x2="20" y2="52" />
        {/* / direction */}
        <line x1="38" y1="4"  x2="6"  y2="44" />
        <line x1="28" y1="-2" x2="-4" y2="32" />
        <line x1="48" y1="14" x2="16" y2="52" />
      </g>

      {/* Arch outer frame */}
      <path
        d="M2 43V18C2 9.163 9.163 2 18 2C26.837 2 34 9.163 34 18V43"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="2" y1="43" x2="34" y2="43" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />

      {/* Bottom marker (wine / location pin style) */}
      <circle cx="18" cy="36" r="3.8" fill="currentColor" />
      <circle cx="18" cy="36" r="1.6" fill="#F0EBE0" />
    </svg>
  );
}

export default function Root() {
  return (
    // Outer: full-screen brand gutter for desktop
    <div className="min-h-screen bg-[#E5DFD5]">
      {/* Centered app shell — max-w-md on desktop, full-width on mobile */}
      <div className="relative w-full max-w-md mx-auto min-h-screen bg-[#F0EBE0] shadow-[0_0_48px_rgba(0,0,0,0.12)]">

        {/* Sticky top header */}
        <header className="sticky top-0 z-40 bg-[#F0EBE0] border-b border-black/[0.07]">
          <div className="flex items-center justify-center h-14 px-4">
            <Link
              to="/"
              className="flex items-center gap-2.5 text-[#2D3A3A] hover:opacity-80 transition-opacity"
              aria-label="wine gallery — início"
            >
              <WineGalleryIcon size={26} />
              <span className="font-gelica text-[22px] font-semibold tracking-wide lowercase leading-none">
                wine gallery
              </span>
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
