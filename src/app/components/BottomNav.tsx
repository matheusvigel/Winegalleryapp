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

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {links.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" strokeWidth={active ? 2.5 : 2} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
