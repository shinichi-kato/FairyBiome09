import { red } from '@material-ui/core/colors';
import { createMuiTheme } from '@material-ui/core/styles';

// A custom theme for this app
const theme = createMuiTheme({
  overrides: {
    MuiCssBaseline: {
      "@global": {
        html: {
          width: "100%",
          height: "100%",
          margin: 0,
          padding: 0,
          webkitFontSmoothing: "antialiased",
          mozOsxFontSmoothing: "grayscale",
          overscrollBehaviorY: "none",
          backgroundColor: "#eeeeee",
        },
        body: {
          position: "fixed",
          width: "100%",
          height: "100%",
          "@media (min-width: 481px)": {
            width: 480,
            marginLeft: "calc((100% - 480px)  * 0.3)",
            marginRight: "calc((100% - 480px) * 0.7)",
          },
        }
      }
    }
  },
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
});

export default theme;