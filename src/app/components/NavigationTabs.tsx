import { Link, useLocation } from 'react-router';
import { motion } from 'motion/react';

const TABS = [
  { id: 'home',    label: 'Para você',  path: '/' },
  { id: 'regions', label: 'Regiões',    path: '/regions' },
  { id: 'brands',  label: 'Vinícolas',  path: '/brands' },
  { id: 'grapes',  label: 'Uvas',       path: '/grapes' },
  { id: 'edu',     label: 'Educação',   path: '/educacao' },
] as const;

function getActiveTab(pathname: string) {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/regions') || pathname.startsWith('/country') || pathname.startsWith('/region')) return 'regions';
  if (pathname.startsWith('/brands') || pathname.startsWith('/brand')) return 'brands';
  if (pathname.startsWith('/grapes') || pathname.startsWith('/grape')) return 'grapes';
  if (pathname.startsWith('/educacao')) return 'edu';
  return 'home';
}

export function NavigationTabs() {
  const { pathname } = useLocation();
  const activeTab = getActiveTab(pathname);

  return (
    <div className="bg-white border-b border-neutral-200 sticky top-[52px] z-20 overflow-x-auto scrollbar-hide">
      <div className="flex min-w-max px-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
