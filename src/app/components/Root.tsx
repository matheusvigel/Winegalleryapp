import { Outlet, Link } from 'react-router';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import { NavigationTabs } from './NavigationTabs';

export default function Root() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'white',
          color: 'text.primary',
          borderBottom: 0,
        }}
      >
        <Toolbar sx={{ minHeight: '52px !important', px: 1 }}>
          <IconButton size="small" edge="start" color="inherit" sx={{ mr: 0.5 }}>
            <MenuIcon fontSize="small" />
          </IconButton>
          <Typography
            component={Link}
            to="/"
            variant="subtitle1"
            fontWeight={700}
            sx={{ flex: 1, textAlign: 'center', textDecoration: 'none', color: 'inherit', letterSpacing: '-0.3px' }}
          >
            Wine Gallery
          </Typography>
          <IconButton size="small" edge="end" color="inherit" sx={{ ml: 0.5 }}>
            <SearchIcon fontSize="small" />
          </IconButton>
        </Toolbar>
        <NavigationTabs />
      </AppBar>

      <Box component="main">
        <Outlet />
      </Box>
    </Box>
  );
}
