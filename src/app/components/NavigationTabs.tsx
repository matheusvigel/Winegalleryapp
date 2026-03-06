import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useLocation, useNavigate } from 'react-router';

const TABS = [
  { value: '/',          label: 'Para você'  },
  { value: '/regions',   label: 'Regiões'    },
  { value: '/brands',    label: 'Vinícolas'  },
  { value: '/grapes',    label: 'Uvas'       },
  { value: '/educacao',  label: 'Educação'   },
];

function getTabValue(pathname: string): string {
  if (pathname === '/') return '/';
  if (pathname.startsWith('/regions') || pathname.startsWith('/country') || pathname.startsWith('/region')) return '/regions';
  if (pathname.startsWith('/brands') || pathname.startsWith('/brand')) return '/brands';
  if (pathname.startsWith('/grapes') || pathname.startsWith('/grape')) return '/grapes';
  if (pathname.startsWith('/educacao')) return '/educacao';
  return '/';
}

export function NavigationTabs() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currentTab = getTabValue(pathname);

  return (
    <Tabs
      value={currentTab}
      onChange={(_, val: string) => navigate(val)}
      variant="scrollable"
      scrollButtons={false}
      sx={{
        minHeight: 40,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'white',
        '& .MuiTab-root': {
          fontSize: '0.85rem',
          minHeight: 40,
          minWidth: 'auto',
          px: 2,
          py: 0.75,
          color: 'text.secondary',
          '&.Mui-selected': { color: 'text.primary', fontWeight: 600 },
        },
        '& .MuiTabs-indicator': { height: 2, bgcolor: 'text.primary' },
      }}
    >
      {TABS.map(tab => (
        <Tab key={tab.value} label={tab.label} value={tab.value} disableRipple />
      ))}
    </Tabs>
  );
}
