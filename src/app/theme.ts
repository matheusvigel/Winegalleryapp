import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#7A1B3A',
      light: '#A63558',
      dark: '#4E1025',
      contrastText: '#fff',
    },
    secondary: {
      main: '#C5A96D',
      contrastText: '#1C1B1F',
    },
    background: {
      default: '#E8E0D5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1C1B1F',
      secondary: '#6B6B6B',
    },
    divider: 'rgba(0,0,0,0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid rgba(0,0,0,0.06)',
          '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' },
          transition: 'box-shadow 0.2s ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.72rem' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, height: 5, backgroundColor: 'rgba(0,0,0,0.08)' },
        bar: { borderRadius: 99, backgroundColor: '#7A1B3A' },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: { boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' } },
      },
    },
  },
});

export default theme;
