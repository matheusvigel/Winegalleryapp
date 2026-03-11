import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Home, MapPin, Building2, Leaf, User } from 'lucide-react';

const TABS = [
  { value: '/',        label: 'Início',    Icon: Home },
  { value: '/regions', label: 'Regiões',   Icon: MapPin },
  { value: '/brands',  label: 'Vinícolas', Icon: Building2 },
  { value: '/grapes',  label: 'Uvas',      Icon: Leaf },
  { value: '/profile', label: 'Perfil',    Icon: User },
];

function getActive(pathname: string): string {
  if (pathname === '/') return '/';
  if (pathname.startsWith('/region') || pathname.startsWith('/country')) return '/regions';
  if (pathname.startsWith('/brand')) return '/brands';
  if (pathname.startsWith('/grape')) return '/grapes';
  if (pathname.startsWith('/profile')) return '/profile';
  return '/';
}

/** Arch window icon — Wine Gallery brand mark */
function WineArchIcon({ size = 30 }: { size?: number }) {
  const h = Math.round((size * 68) / 52);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 52 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="wg-arch-clip">
          <path d="M8,66 L8,23 Q8,6 26,6 Q44,6 44,23 L44,66 Z" />
        </clipPath>
      </defs>

      {/* Outer arch frame */}
      <path
        d="M3,68 L3,23 Q3,2 26,2 Q49,2 49,23 L49,68 Z"
        stroke="currentColor"
        strokeWidth="2.5"
      />

      {/* Lattice — clipped to inner arch */}
      <g clipPath="url(#wg-arch-clip)" stroke="currentColor" strokeWidth="1.4">
        {/* "/" diagonals (slope -1) */}
        <line x1="-60" y1="74"  x2="120" y2="-106" />
        <line x1="-60" y1="90"  x2="120" y2="-90"  />
        <line x1="-60" y1="106" x2="120" y2="-74"  />
        <line x1="-60" y1="122" x2="120" y2="-58"  />
        <line x1="-60" y1="138" x2="120" y2="-42"  />
        {/* "\" diagonals (slope +1) */}
        <line x1="-40" y1="-78" x2="90" y2="52"  />
        <line x1="-40" y1="-62" x2="90" y2="68"  />
        <line x1="-40" y1="-46" x2="90" y2="84"  />
        <line x1="-40" y1="-30" x2="90" y2="100" />
        <line x1="-40" y1="-14" x2="90" y2="116" />
        <line x1="-40" y1="2"   x2="90" y2="132" />
      </g>

      {/* Inner arch frame (on top of lattice) */}
      <path
        d="M8,66 L8,23 Q8,6 26,6 Q44,6 44,23 L44,66 Z"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Bottom ornament circles */}
      <circle cx="18" cy="57" r="5"   stroke="currentColor" strokeWidth="1.8" />
      <circle cx="34" cy="57" r="5"   stroke="currentColor" strokeWidth="1.8" />
      <circle cx="26" cy="49" r="3.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default function Root() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = getActive(pathname);

  return (
    <div className="min-h-screen bg-[#E8E0D5]">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#E8E0D5] border-b border-[#D0C8BC]">

        {/* Mobile: centered logo */}
        <div className="flex items-center justify-center h-14 px-5 md:hidden">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-[#1C1B1F] hover:opacity-75 transition-opacity"
            style={{ textDecoration: 'none' }}
          >
            <WineArchIcon size={26} />
            <span
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: 1,
                letterSpacing: '-0.3px',
              }}
            >
              wine gallery
            </span>
          </Link>
        </div>

        {/* Desktop: logo left + nav links right */}
        <div className="hidden md:flex items-center justify-between h-16 px-8 max-w-screen-xl mx-auto">
          <Link
            to="/"
            className="flex items-center gap-3 text-[#1C1B1F] hover:opacity-75 transition-opacity"
            style={{ textDecoration: 'none' }}
          >
            <WineArchIcon size={30} />
            <span
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 700,
                fontSize: '22px',
                lineHeight: 1,
              }}
            >
              wine gallery
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => navigate(value)}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  active === value
                    ? 'bg-white/80 text-[#7A1B3A]'
                    : 'text-[#6B6B6B] hover:text-[#1C1B1F] hover:bg-white/40'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────── */}
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* ── Bottom tab bar (mobile only) ───────────────────── */}
      <nav
        role="tablist"
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#EAE2DA] md:hidden"
        style={{ boxShadow: '0 -1px 0 rgba(0,0,0,0.06)' }}
      >
        <div className="flex h-16">
          {TABS.map(({ value, label, Icon }) => {
            const isActive = active === value;
            return (
              <button
                key={value}
                role="tab"
                aria-selected={isActive}
                onClick={() => navigate(value)}
                className="flex flex-col items-center justify-center gap-[3px] flex-1"
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  color={isActive ? '#7A1B3A' : '#9B9B9B'}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isActive ? '#7A1B3A' : '#9B9B9B' }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
