import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#690037',
      light: '#94004e',
      dark: '#450024',
      contrastText: '#fff',
    },
    secondary: {
      main: '#F1BD85',
      contrastText: '#2D3A3A',
    },
    background: {
      default: '#F0EBE0',
      paper: '#FAFAF7',
    },
    text: {
      primary: '#2D3A3A',
      secondary: '#6B6B6B',
    },
    divider: 'rgba(0,0,0,0.07)',
  },
  typography: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    h1: { fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600 },
    h2: { fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600 },
    h3: { fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid rgba(0,0,0,0.06)',
          backgroundColor: 'rgba(250,250,247,0.8)',
          transition: 'box-shadow 0.2s ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.72rem' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 4 },
        bar: { borderRadius: 4 },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#F0EBE0',
          color: '#2D3A3A',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        },
      },
    },
  },
});

export default theme;
