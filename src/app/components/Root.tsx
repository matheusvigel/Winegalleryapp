import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Home, MapPin, Building2, Leaf, User } from 'lucide-react';

const BG   = '#E9E3D9';
const CARD = '#FFFFFF';
const WINE = '#690037';
const TEXT1 = '#1C1B1F';
const TEXT2 = '#5C5C5C';
const MUTED = '#9B9B9B';
const BORDER = 'rgba(0,0,0,0.08)';

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
      <circle cx="27" cy="1.5" r="1.5" fill={color} />
      <path d="M2,76 L2,24 Q2,0 27,0 Q52,0 52,24 L52,76 Z" stroke={color} strokeWidth="2.2" fill="none" />
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
      <path d="M7,74 L7,24 Q7,4 27,4 Q47,4 47,24 L47,74 Z" stroke={color} strokeWidth="1.8" fill="none" />
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
    <div style={{ minHeight: '100vh', backgroundColor: BG, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ════════════════════════════════════════════════════════
          MOBILE layout (< lg)
          ════════════════════════════════════════════════════════ */}

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-30" style={{ backgroundColor: BG, borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-center h-14 px-5">
          <Link to="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
            <WineArchIcon size={26} color={TEXT1} />
            <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: '20px', lineHeight: 1, color: TEXT1, letterSpacing: '-0.01em' }}>
              wine gallery
            </span>
          </Link>
        </div>
      </header>

      {/* Mobile main content */}
      <main className="lg:hidden pb-20">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav role="tablist" className="lg:hidden fixed bottom-0 left-0 right-0 z-30"
        style={{ backgroundColor: CARD, borderTop: `1px solid ${BORDER}` }}>
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
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} color={isActive ? WINE : MUTED} />
                <span style={{ fontFamily: "'DM Sans'", fontSize: '10px', fontWeight: isActive ? 600 : 400, color: isActive ? WINE : MUTED }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════
          DESKTOP layout (lg+) — 3-column Instagram-style
          ════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex min-h-screen">

        {/* ── Left sidebar nav ──────────────────────────────── */}
        <aside
          className="sticky top-0 h-screen flex-shrink-0"
          style={{
            width: 240,
            backgroundColor: BG,
            borderRight: `1px solid ${BORDER}`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Logo */}
          <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${BORDER}` }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <WineArchIcon size={30} color={TEXT1} />
              <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: '21px', lineHeight: 1, color: TEXT1, letterSpacing: '-0.01em' }}>
                wine gallery
              </span>
            </Link>
          </div>

          {/* Nav links */}
          <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TABS.map(({ value, label, Icon }) => {
              const isActive = active === value;
              return (
                <button
                  key={value}
                  onClick={() => navigate(value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isActive ? 'rgba(105,0,55,0.08)' : 'transparent',
                    transition: 'background-color 0.15s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} color={isActive ? WINE : TEXT2} />
                  <span style={{
                    fontFamily: "'DM Sans'",
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? WINE : TEXT2,
                    letterSpacing: '-0.01em',
                  }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Footer hint */}
          <div style={{ padding: '12px 20px 20px', borderTop: `1px solid ${BORDER}` }}>
            <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', color: MUTED, letterSpacing: '0.04em' }}>
              Beba com moderação
            </span>
          </div>
        </aside>

        {/* ── Center content column — centered in remaining space ── */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 430, minHeight: '100vh', borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
