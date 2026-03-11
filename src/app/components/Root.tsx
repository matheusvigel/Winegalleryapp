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
function WineArchIcon({ size = 30, color = 'currentColor' }: { size?: number; color?: string }) {
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
      <path
        d="M3,68 L3,23 Q3,2 26,2 Q49,2 49,23 L49,68 Z"
        stroke={color}
        strokeWidth="2.5"
      />
      <g clipPath="url(#wg-arch-clip)" stroke={color} strokeWidth="1.4">
        <line x1="-60" y1="74"  x2="120" y2="-106" />
        <line x1="-60" y1="90"  x2="120" y2="-90"  />
        <line x1="-60" y1="106" x2="120" y2="-74"  />
        <line x1="-60" y1="122" x2="120" y2="-58"  />
        <line x1="-60" y1="138" x2="120" y2="-42"  />
        <line x1="-40" y1="-78" x2="90" y2="52"  />
        <line x1="-40" y1="-62" x2="90" y2="68"  />
        <line x1="-40" y1="-46" x2="90" y2="84"  />
        <line x1="-40" y1="-30" x2="90" y2="100" />
        <line x1="-40" y1="-14" x2="90" y2="116" />
        <line x1="-40" y1="2"   x2="90" y2="132" />
      </g>
      <path
        d="M8,66 L8,23 Q8,6 26,6 Q44,6 44,23 L44,66 Z"
        stroke={color}
        strokeWidth="2"
      />
      <circle cx="18" cy="57" r="5"   stroke={color} strokeWidth="1.8" />
      <circle cx="34" cy="57" r="5"   stroke={color} strokeWidth="1.8" />
      <circle cx="26" cy="49" r="3.5" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

export default function Root() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = getActive(pathname);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B0907', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30"
        style={{
          backgroundColor: 'rgba(11, 9, 7, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(197, 162, 90, 0.12)',
        }}
      >
        {/* Mobile: centered logo */}
        <div className="flex items-center justify-center h-14 px-5 md:hidden">
          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            style={{ textDecoration: 'none' }}
          >
            <WineArchIcon size={24} color="#C5A25A" />
            <span
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 600,
                fontSize: '19px',
                lineHeight: 1,
                letterSpacing: '0.02em',
                color: '#E2D4BA',
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
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            style={{ textDecoration: 'none' }}
          >
            <WineArchIcon size={28} color="#C5A25A" />
            <span
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 600,
                fontSize: '21px',
                lineHeight: 1,
                letterSpacing: '0.02em',
                color: '#E2D4BA',
              }}
            >
              wine gallery
            </span>
          </Link>

          <nav className="flex items-center gap-0.5">
            {TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => navigate(value)}
                className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
                style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  letterSpacing: '0.01em',
                  color: active === value ? '#C5A25A' : '#8C8074',
                  backgroundColor: active === value ? 'rgba(197, 162, 90, 0.10)' : 'transparent',
                  border: active === value ? '1px solid rgba(197, 162, 90, 0.18)' : '1px solid transparent',
                }}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Page content ─────────────────────────────────────────── */}
      <main className="pb-20 md:pb-0">
        <div className="md:max-w-[430px] md:mx-auto md:min-h-screen" style={{ borderLeft: '1px solid rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
          <Outlet />
        </div>
      </main>

      {/* ── Bottom tab bar (mobile only) ─────────────────────────── */}
      <nav
        role="tablist"
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
        style={{
          backgroundColor: 'rgba(11, 9, 7, 0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(197, 162, 90, 0.10)',
        }}
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
                className="flex flex-col items-center justify-center gap-[3px] flex-1 transition-all"
                style={{ position: 'relative' }}
              >
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 28,
                      height: 1.5,
                      backgroundColor: '#C5A25A',
                      borderRadius: '0 0 2px 2px',
                    }}
                  />
                )}
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2 : 1.5}
                  color={isActive ? '#C5A25A' : '#574E47'}
                />
                <span
                  className="text-[10px]"
                  style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? '#C5A25A' : '#574E47',
                    letterSpacing: '0.02em',
                  }}
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
