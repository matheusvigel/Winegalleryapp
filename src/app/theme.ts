import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main:          '#6B0035',   // Vinho Borgonha
      light:         '#9B1B4D',
      dark:          '#4A0024',
      contrastText:  '#FFFFFF',
    },
    secondary: {
      main:          '#2D4A3E',   // Verde Floresta / Adega
      light:         '#3E6655',
      dark:          '#1C3028',
      contrastText:  '#FFFFFF',
    },
    background: {
      default: '#F5EDE0',   // Pergaminho quente
      paper:   '#FFFFFF',
    },
    text: {
      primary:   '#1C1209',
      secondary: '#7A6855',
      disabled:  '#B0A090',
    },
    divider: 'rgba(139, 90, 43, 0.12)',
    error: { main: '#C0392B' },
    warning: { main: '#B8820B' },
    action: {
      hover:    'rgba(107, 0, 53, 0.05)',
      selected: 'rgba(107, 0, 53, 0.10)',
    },
  },
  typography: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    h1: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
    h4: { fontFamily: '"DM Sans"', fontWeight: 700 },
    h5: { fontFamily: '"DM Sans"', fontWeight: 600 },
    h6: { fontFamily: '"DM Sans"', fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: {
      fontWeight:      700,
      letterSpacing:   '0.08em',
      textTransform:   'uppercase',
      fontSize:        '0.65rem',
      color:           '#7A6855',
    },
    body1: { lineHeight: 1.65 },
    body2: { lineHeight: 1.65 },
    button: { textTransform: 'none', fontWeight: 600 },
    caption: { color: '#B0A090' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(139, 90, 43, 0.12)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': { boxShadow: '0 4px 14px rgba(28, 18, 9, 0.09)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage:  'none',
          backgroundColor:  '#FFFFFF',
          border:           '1px solid rgba(139, 90, 43, 0.12)',
        },
        elevation1: { boxShadow: '0 1px 4px rgba(28, 18, 9, 0.08)' },
        elevation2: { boxShadow: '0 4px 14px rgba(28, 18, 9, 0.09)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize:   '0.68rem',
          fontFamily: '"DM Sans", system-ui, sans-serif',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight:    500,
          fontFamily:    '"DM Sans", system-ui, sans-serif',
          color:         '#B0A090',
          '&.Mui-selected': { color: '#6B0035', fontWeight: 700 },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: '#6B0035', height: 2 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius:    99,
          height:          4,
          backgroundColor: 'rgba(139, 90, 43, 0.12)',
        },
        bar: { borderRadius: 99, backgroundColor: '#6B0035' },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 2px 8px rgba(107, 0, 53, 0.25)' },
        },
        outlined: {
          borderColor: 'rgba(139, 90, 43, 0.20)',
          '&:hover': { borderColor: '#6B0035', backgroundColor: 'rgba(107, 0, 53, 0.04)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#F0E8DC',
            '& fieldset':                { borderColor: 'rgba(139, 90, 43, 0.20)' },
            '&:hover fieldset':          { borderColor: 'rgba(139, 90, 43, 0.40)' },
            '&.Mui-focused fieldset':    { borderColor: '#6B0035' },
          },
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(139, 90, 43, 0.08)' },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          '&:hover .MuiCardActionArea-focusHighlight': {
            backgroundColor: 'rgba(107, 0, 53, 0.03)',
          },
        },
      },
    },
  },
});

export default theme;
