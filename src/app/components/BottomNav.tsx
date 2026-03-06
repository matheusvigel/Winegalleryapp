import { Link, useLocation } from 'react-router';
import { Home, MapPin, Building2, Leaf, User } from 'lucide-react';

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Início',
    icon: Home,
    match: (p: string) => p === '/',
  },
  {
    to: '/regions',
    label: 'Regiões',
    icon: MapPin,
    match: (p: string) =>
      p.startsWith('/regions') ||
      p.startsWith('/country') ||
      (p.startsWith('/region') && !p.startsWith('/regions')),
  },
  {
    to: '/brands',
    label: 'Vinícolas',
    icon: Building2,
    match: (p: string) => p.startsWith('/brands') || p.startsWith('/brand'),
  },
  {
    to: '/grapes',
    label: 'Uvas',
    icon: Leaf,
    match: (p: string) => p.startsWith('/grapes') || p.startsWith('/grape'),
  },
  {
    to: '/profile',
    label: 'Perfil',
    icon: User,
    match: (p: string) => p.startsWith('/profile'),
  },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    // Overlay centered to align with the max-w-md app shell
    <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <nav className="w-full max-w-md bg-[#FAFAF7] border-t border-black/[0.07] pointer-events-auto">
        <div className="flex justify-around items-center px-1 pt-2 pb-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 flex-1 min-w-0 transition-colors ${
                  active ? 'text-[#690037]' : 'text-neutral-400'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.6} />
                <span
                  className={`text-[10px] tracking-wide leading-none ${
                    active ? 'font-semibold' : 'font-normal'
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
