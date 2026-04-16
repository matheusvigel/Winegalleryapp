import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Globe, MapPin, BookOpen,
  Wine, Building2, Grape, LogOut, Menu, X, Star, Sparkles, Users,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const navItems = [
  { to: '/admin',              label: 'Dashboard',    icon: LayoutDashboard, end: true,  table: null           },
  { to: '/admin/countries',    label: 'Países',       icon: Globe,           end: false, table: null           },
  { to: '/admin/regions',      label: 'Regiões',      icon: MapPin,          end: false, table: 'regions'      },
  { to: '/admin/collections',  label: 'Coleções',     icon: BookOpen,        end: false, table: 'collections'  },
  { to: '/admin/wines',        label: 'Vinhos',       icon: Wine,            end: false, table: 'wines'        },
  { to: '/admin/brands',       label: 'Vinícolas',    icon: Building2,       end: false, table: 'wineries'     },
  { to: '/admin/experiences',  label: 'Experiências', icon: Star,            end: false, table: 'experiences'  },
  { to: '/admin/grapes',       label: 'Uvas',         icon: Grape,           end: false, table: 'grapes'       },
  { to: '/admin/brotherhoods', label: 'Confrarias',   icon: Users,           end: false, table: 'brotherhoods' },
  { to: '/admin/highlights',   label: 'Destaques',    icon: Sparkles,        end: false, table: 'highlights'   },
] as const;

type Counts = Partial<Record<string, number>>;

export default function BackofficeLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>({});

  useEffect(() => {
    const tables = navItems.map(n => n.table).filter(Boolean) as string[];
    Promise.all(
      tables.map(t =>
        supabase.from(t as never).select('*', { count: 'exact', head: true }).then(r => [t, r.count ?? 0] as const)
      )
    ).then(results => setCounts(Object.fromEntries(results)));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const Sidebar = () => (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col h-full">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-purple-700 rounded-lg flex items-center justify-center">
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
          {navItems.map(({ to, label, icon: Icon, end, table }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={17} />
                    <span className="flex-1">{label}</span>
                    {table && counts[table] !== undefined && (
                      <span className={`text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-md min-w-[20px] text-center ${
                        isActive
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        {counts[table]}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-neutral-200 shrink-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-900 truncate">{user?.email}</p>
            <p className="text-[11px] text-neutral-500">Administrador</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
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
            <div className="w-6 h-6 bg-purple-700 rounded flex items-center justify-center">
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
