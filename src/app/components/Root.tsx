import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Home, Compass, Users, Trophy, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV_LINKS = [
  { path: '/',              label: 'Início',     Icon: Home    },
  { path: '/explore',       label: 'Explorar',   Icon: Compass },
  { path: '/brotherhoods',  label: 'Confrarias', Icon: Users   },
  { path: '/achievements',  label: 'Conquistas', Icon: Trophy  },
];

const MOBILE_NAV = [
  { path: '/',              label: 'Início',     Icon: Home    },
  { path: '/explore',       label: 'Explorar',   Icon: Compass },
  { path: '/brotherhoods',  label: 'Confrarias', Icon: Users   },
  { path: '/profile',       label: 'Perfil',     Icon: User    },
];

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

function useActive() {
  const { pathname } = useLocation();
  return (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };
}

export default function Root() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isActive = useActive();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">

      {/* ═══════════════════════════════════════════════════════
          DESKTOP top navbar (lg+)
          ═══════════════════════════════════════════════════════ */}
      <header className="hidden lg:block sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between gap-8">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 no-underline">
            <WineArchIcon size={26} color="#7c3aed" />
            <span className="font-bold text-lg tracking-tight text-gray-900" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              wine gallery
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(({ path, label, Icon }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                    active
                      ? 'text-purple-700 bg-purple-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={active ? 2.5 : 2} />
                  {label}
                  {active && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-purple-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: user avatar */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => navigate('/profile')}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isActive('/profile')
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="avatar"
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5" strokeWidth={isActive('/profile') ? 2.5 : 2} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          MOBILE top header (< lg)
          ═══════════════════════════════════════════════════════ */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-center h-14 px-5">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <WineArchIcon size={24} color="#7c3aed" />
            <span className="font-bold text-lg tracking-tight text-gray-900" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              wine gallery
            </span>
          </Link>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          Content
          ═══════════════════════════════════════════════════════ */}
      <main className="lg:pb-0 pb-20">
        {/* Desktop: full-width container */}
        <div className="hidden lg:block">
          <Outlet />
        </div>
        {/* Mobile: keep as-is */}
        <div className="lg:hidden">
          <Outlet />
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════
          MOBILE bottom nav (< lg)
          ═══════════════════════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="flex justify-around items-center h-16">
          {MOBILE_NAV.map(({ path, label, Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors no-underline ${
                  active ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6 mb-0.5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
