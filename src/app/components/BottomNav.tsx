import { Link, useLocation } from 'react-router';
import { Home, Compass, Users, User } from 'lucide-react';

const links = [
  { path: '/',             icon: Home,    label: 'Início'    },
  { path: '/explore',      icon: Compass, label: 'Explorar'  },
  { path: '/brotherhoods', icon: Users,   label: 'Confrarias'},
  { path: '/profile',      icon: User,    label: 'Perfil'    },
];

export function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
         style={{ background: '#FFFFFF', borderTop: '1px solid rgba(139,90,43,0.12)' }}>
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {links.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors duration-150"
              style={{ color: active ? '#6B0035' : '#B0A090' }}
            >
              <div
                className="flex items-center justify-center w-10 h-6 rounded-full mb-0.5 transition-colors duration-150"
                style={{ background: active ? 'rgba(107,0,53,0.08)' : 'transparent' }}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.75} />
              </div>
              <span className="text-[10px] font-semibold tracking-wide"
                    style={{ fontFamily: '"DM Sans", sans-serif' }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
