import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#C5A25A',      // aged brass gold
      light: '#D4B470',
      dark: '#A07A30',
      contrastText: '#0B0907',
    },
    secondary: {
      main: '#8B1A36',      // deep burgundy
      light: '#A8234A',
      dark: '#5E1025',
      contrastText: '#E2D4BA',
    },
    background: {
      default: '#0B0907',   // near-black warm
      paper: '#141210',     // card surfaces
    },
    text: {
      primary: '#E2D4BA',   // parchment
      secondary: '#8C8074', // warm gray
      disabled: '#574E47',
    },
    divider: 'rgba(255,255,255,0.07)',
    error: { main: '#C0392B' },
    action: {
      hover: 'rgba(197, 162, 90, 0.06)',
      selected: 'rgba(197, 162, 90, 0.10)',
      disabledBackground: 'rgba(255,255,255,0.05)',
    },
  },
  typography: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    h1: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 },
    h2: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600 },
    h3: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 500 },
    h4: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 500 },
    h5: { fontFamily: '"DM Sans", system-ui, sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"DM Sans", system-ui, sans-serif', fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.7rem' },
    body1: { lineHeight: 1.65 },
    body2: { lineHeight: 1.65 },
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: '0.01em' },
    caption: { color: '#8C8074' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0B0907',
          color: '#E2D4BA',
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: '#141210',
          border: '1px solid rgba(255,255,255,0.07)',
          '&:hover': { borderColor: 'rgba(197,162,90,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' },
          transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.68rem',
          letterSpacing: '0.03em',
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
          color: '#8C8074',
          '&.Mui-selected': { color: '#C5A25A' },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: '#C5A25A', height: 1 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 99,
          height: 3,
          backgroundColor: 'rgba(255,255,255,0.08)',
        },
        bar: { borderRadius: 99, backgroundColor: '#C5A25A' },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.4)' },
        },
        outlined: {
          borderColor: 'rgba(255,255,255,0.15)',
          '&:hover': { borderColor: 'rgba(197,162,90,0.4)', backgroundColor: 'rgba(197,162,90,0.06)' },
        },
        text: {
          '&:hover': { backgroundColor: 'rgba(197,162,90,0.06)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#1C1915',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(197,162,90,0.3)' },
            '&.Mui-focused fieldset': { borderColor: '#C5A25A' },
          },
          '& .MuiInputBase-input': { color: '#E2D4BA' },
          '& .MuiInputLabel-root': { color: '#8C8074' },
          '& .MuiInputLabel-root.Mui-focused': { color: '#C5A25A' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#141210',
          border: '1px solid rgba(255,255,255,0.07)',
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(255,255,255,0.06)' },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          '&:hover .MuiCardActionArea-focusHighlight': {
            backgroundColor: 'rgba(197,162,90,0.06)',
          },
        },
      },
    },
  },
});

export default theme;
