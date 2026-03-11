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

/** Arch window icon — fiel ao logo oficial */
function WineArchIcon({ size = 28, color = '#1C1B1F' }: { size?: number; color?: string }) {
  const h = Math.round((size * 76) / 54);
  return (
    <svg width={size} height={h} viewBox="0 0 54 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="wg-root-clip">
          <path d="M7,74 L7,24 Q7,4 27,4 Q47,4 47,24 L47,74 Z" />
        </clipPath>
      </defs>
      {/* Dot at top */}
      <circle cx="27" cy="1.5" r="1.5" fill={color} />
      {/* Outer arch frame */}
      <path d="M2,76 L2,24 Q2,0 27,0 Q52,0 52,24 L52,76 Z" stroke={color} strokeWidth="2.2" fill="none" />
      {/* Lattice inside arch */}
      <g clipPath="url(#wg-root-clip)" stroke={color} strokeWidth="1.3" opacity="1">
        <line x1="-20" y1="60"  x2="80" y2="-40" />
        <line x1="-20" y1="80"  x2="80" y2="-20" />
        <line x1="-20" y1="100" x2="80" y2="0"   />
        <line x1="-20" y1="120" x2="80" y2="20"  />
        <line x1="-20" y1="140" x2="80" y2="40"  />
        <line x1="-20" y1="160" x2="80" y2="60"  />
        <line x1="-20" y1="0"   x2="80" y2="100" />
        <line x1="-20" y1="20"  x2="80" y2="120" />
        <line x1="-20" y1="40"  x2="80" y2="140" />
        <line x1="-20" y1="60"  x2="80" y2="160" />
        <line x1="-20" y1="80"  x2="80" y2="180" />
        <line x1="-20" y1="100" x2="80" y2="200" />
      </g>
      {/* Inner arch frame (on top) */}
      <path d="M7,74 L7,24 Q7,4 27,4 Q47,4 47,24 L47,74 Z" stroke={color} strokeWidth="1.8" fill="none" />
      {/* Bottom ornament */}
      <circle cx="18" cy="62" r="5.5" stroke={color} strokeWidth="1.6" fill="none" />
      <circle cx="36" cy="62" r="5.5" stroke={color} strokeWidth="1.6" fill="none" />
      <circle cx="27" cy="53" r="3.5" stroke={color} strokeWidth="1.4" fill="none" />
    </svg>
  );
}

export default function Root() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = getActive(pathname);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E9E3D9', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30"
        style={{ backgroundColor: '#E9E3D9', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        {/* Mobile: centered logo */}
        <div className="flex items-center justify-center h-14 px-5 md:hidden">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity" style={{ textDecoration: 'none' }}>
            <WineArchIcon size={26} color="#1C1B1F" />
            <span style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontWeight: 700,
              fontSize: '20px',
              lineHeight: 1,
              color: '#1C1B1F',
              letterSpacing: '-0.01em',
            }}>
              wine gallery
            </span>
          </Link>
        </div>

        {/* Desktop: logo left + nav right */}
        <div className="hidden md:flex items-center justify-between h-16 px-8 max-w-screen-xl mx-auto">
          <Link to="/" className="flex items-center gap-3 hover:opacity-75 transition-opacity" style={{ textDecoration: 'none' }}>
            <WineArchIcon size={30} color="#1C1B1F" />
            <span style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontWeight: 700,
              fontSize: '22px',
              lineHeight: 1,
              color: '#1C1B1F',
              letterSpacing: '-0.01em',
            }}>
              wine gallery
            </span>
          </Link>

          <nav className="flex items-center gap-0.5">
            {TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => navigate(value)}
                className="px-4 py-2 rounded-lg text-[13px] transition-colors"
                style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontWeight: active === value ? 600 : 400,
                  color: active === value ? '#690037' : '#5C5C5C',
                  backgroundColor: active === value ? 'rgba(105,0,55,0.07)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
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
        <div className="md:max-w-[430px] md:mx-auto md:min-h-screen" style={{ borderLeft: '1px solid rgba(0,0,0,0.05)', borderRight: '1px solid rgba(0,0,0,0.05)' }}>
          <Outlet />
        </div>
      </main>

      {/* ── Bottom tab bar (mobile only) ─────────────────────────── */}
      <nav
        role="tablist"
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
        style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 -1px 0 rgba(0,0,0,0.04)' }}
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
                className="flex flex-col items-center justify-center gap-[3px] flex-1 transition-colors"
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  color={isActive ? '#690037' : '#9B9B9B'}
                />
                <span style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: '10px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#690037' : '#9B9B9B',
                }}>
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
