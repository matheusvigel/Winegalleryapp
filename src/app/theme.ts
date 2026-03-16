import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#690037',      // Vinho Intenso
      light: '#8A0047',
      dark: '#4A0025',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2D3A3A',      // Verde Adega
      light: '#3E5050',
      dark: '#1C2626',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#E9E3D9',   // creme principal
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1C1B1F',
      secondary: '#5C5C5C',
      disabled: '#BEBEBE',
    },
    divider: 'rgba(0,0,0,0.08)',
    error: { main: '#C0392B' },
    action: {
      hover: 'rgba(0,0,0,0.04)',
      selected: 'rgba(105,0,55,0.08)',
    },
  },
  typography: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    h1: { fontFamily: '"DM Sans"', fontWeight: 700 },
    h2: { fontFamily: '"DM Sans"', fontWeight: 700 },
    h3: { fontFamily: '"DM Sans"', fontWeight: 600 },
    h4: { fontFamily: '"DM Sans"', fontWeight: 600 },
    h5: { fontFamily: '"DM Sans"', fontWeight: 600 },
    h6: { fontFamily: '"DM Sans"', fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: {
      fontWeight: 500,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      fontSize: '0.68rem',
    },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 500 },
    caption: { color: '#9B9B9B' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.10)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.08)',
        },
        elevation1: { boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
        elevation2: { boxShadow: '0 2px 8px rgba(0,0,0,0.10)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.68rem',
          fontFamily: '"DM Sans", system-ui, sans-serif',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontFamily: '"DM Sans", system-ui, sans-serif',
          color: '#9B9B9B',
          '&.Mui-selected': { color: '#690037', fontWeight: 600 },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: '#690037', height: 2 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 99,
          height: 4,
          backgroundColor: 'rgba(0,0,0,0.08)',
        },
        bar: { borderRadius: 99, backgroundColor: '#2D3A3A' },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: { boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } },
        outlined: {
          borderColor: 'rgba(0,0,0,0.15)',
          '&:hover': { borderColor: '#690037', backgroundColor: 'rgba(105,0,55,0.04)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#F5F0E8',
            '& fieldset': { borderColor: 'rgba(0,0,0,0.12)' },
            '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.25)' },
            '&.Mui-focused fieldset': { borderColor: '#690037' },
          },
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(0,0,0,0.07)' },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          '&:hover .MuiCardActionArea-focusHighlight': {
            backgroundColor: 'rgba(0,0,0,0.03)',
          },
        },
      },
    },
  },
});

export default theme;
