import { Link, useLocation } from 'react-router';
import { Home, Compass, User } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();
  const { pathname } = location;

  const isExplorerActive = ['/region', '/country', '/brands', '/brand', '/grapes', '/grape'].some(
    p => pathname.startsWith(p)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 py-3 z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 ${
            pathname === '/' ? 'text-red-800' : 'text-neutral-500'
          }`}
        >
          <Home size={24} />
          <span className="text-xs">Início</span>
        </Link>

        <Link
          to="/"
          className={`flex flex-col items-center gap-1 ${
            isExplorerActive ? 'text-red-800' : 'text-neutral-500'
          }`}
        >
          <Compass size={24} />
          <span className="text-xs">Explorar</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center gap-1 ${
            pathname.startsWith('/profile') ? 'text-red-800' : 'text-neutral-500'
          }`}
        >
          <User size={24} />
          <span className="text-xs">Perfil</span>
        </Link>
      </div>
    </nav>
  );
}
