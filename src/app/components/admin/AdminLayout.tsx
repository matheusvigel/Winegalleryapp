import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import {
  Globe,
  MapPin,
  Wine,
  Grape,
  LayoutDashboard,
  Package,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const PIN = import.meta.env.VITE_ADMIN_PIN || '1234';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/countries', label: 'Países', icon: Globe },
  { to: '/admin/regions', label: 'Regiões', icon: MapPin },
  { to: '/admin/collections', label: 'Coleções', icon: Package },
  { to: '/admin/items', label: 'Vinhos & Vinícolas', icon: Wine },
  { to: '/admin/brands', label: 'Marcas', icon: Wine },
  { to: '/admin/grapes', label: 'Uvas', icon: Grape },
];

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === PIN) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">WineGallery</h1>
          <p className="text-neutral-400 text-sm mt-1">Backoffice</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-2">PIN de acesso</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={e => { setPin(e.target.value); setError(false); }}
              placeholder="••••"
              className={`w-full bg-neutral-800 text-white text-center text-2xl tracking-widest rounded-xl px-4 py-4 outline-none border-2 transition-colors ${
                error ? 'border-red-500' : 'border-transparent focus:border-red-700'
              }`}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center mt-2">PIN incorreto</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-red-800 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('admin-unlocked') === '1');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  function handleUnlock() {
    sessionStorage.setItem('admin-unlocked', '1');
    setUnlocked(true);
  }

  function handleLogout() {
    sessionStorage.removeItem('admin-unlocked');
    setUnlocked(false);
    setMenuOpen(false);
  }

  if (!unlocked) return <PinGate onUnlock={handleUnlock} />;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-neutral-900 border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-800 rounded-lg flex items-center justify-center">
              <Wine className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">WineGallery Admin</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-xs text-neutral-400 hover:text-white transition-colors"
        >
          Ver App
        </button>
      </header>

      {/* Slide-over menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="w-72 bg-neutral-900 border-r border-neutral-800 flex flex-col">
            <div className="p-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-800 rounded-lg flex items-center justify-center">
                  <Wine className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold">WineGallery Admin</span>
              </div>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-red-800 text-white'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-neutral-800">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors w-full"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
        </div>
      )}

      {/* Bottom tab nav (visible on mobile when menu is closed) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-neutral-900 border-t border-neutral-800 flex items-center justify-around px-2 py-2">
        {navItems.slice(0, 5).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0 ${
                isActive ? 'text-red-400' : 'text-neutral-500 hover:text-neutral-300'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium truncate max-w-[52px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Page content */}
      <main className="pb-24">
        <Outlet />
      </main>
    </div>
  );
}
