import { red } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';

// A custom theme for this app
const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#fff',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides:{
        body: {
          maxWidth: '600px',
          margin: 'auto'
        }
      }
    }
  }
});

export default theme;