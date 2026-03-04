import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Globe, MapPin, BookOpen,
  Wine, Building2, Grape, LogOut, Menu, X,
} from 'lucide-react';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/countries', label: 'Países', icon: Globe, end: false },
  { to: '/admin/regions', label: 'Regiões', icon: MapPin, end: false },
  { to: '/admin/collections', label: 'Coleções', icon: BookOpen, end: false },
  { to: '/admin/wines', label: 'Vinhos', icon: Wine, end: false },
  { to: '/admin/brands', label: 'Marcas', icon: Building2, end: false },
  { to: '/admin/grapes', label: 'Uvas', icon: Grape, end: false },
];

export default function BackofficeLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const Sidebar = () => (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col h-full">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-red-900 rounded-lg flex items-center justify-center">
            <Wine size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900 leading-none">Wine Gallery</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Backoffice</p>
          </div>
        </div>
        <button className="lg:hidden text-neutral-400 hover:text-neutral-600" onClick={() => setOpen(false)}>
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-50 text-red-900'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-neutral-200 shrink-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-900 font-bold text-sm shrink-0">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-900 truncate">{user?.email}</p>
            <p className="text-[11px] text-neutral-500">Administrador</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 lg:hidden transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full">
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden h-14 bg-white border-b border-neutral-200 flex items-center px-4 shrink-0">
          <button onClick={() => setOpen(true)} className="text-neutral-600 mr-3">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-900 rounded flex items-center justify-center">
              <Wine size={12} className="text-white" />
            </div>
            <span className="font-semibold text-neutral-900 text-sm">Backoffice</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
