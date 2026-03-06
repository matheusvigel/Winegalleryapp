import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#5C1A3E',
      light: '#8C3066',
      dark: '#3A0D27',
      contrastText: '#fff',
    },
    secondary: {
      main: '#C5A96D',
      contrastText: '#1C1B1F',
    },
    background: {
      default: '#F0EBE0',
      paper: '#FAFAF7',
    },
    text: {
      primary: '#1C1B1F',
      secondary: '#6B6B6B',
    },
    divider: 'rgba(0,0,0,0.07)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
          color: '#1C1B1F',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        },
      },
    },
  },
});

export default theme;
