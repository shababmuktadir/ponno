import { createTheme } from "@mui/material/styles";

const shared = {
  typography: {
    fontFamily: '"Kalpurush", "Noto Sans Bengali", system-ui, sans-serif',
    fontSize: 14,
    button: { textTransform: "none", fontWeight: 500 },
  },
  shape: { borderRadius: 12 },
};

export const lightMuiTheme = createTheme({
  ...shared,
  palette: {
    mode: "light",
    background: { paper: "#FFFFFF", default: "#F4F2EE" },
    text: { primary: "#0B0B0C", secondary: "#56565C" },
    primary: { main: "#1C1C1F" },
    divider: "rgba(11,11,12,0.08)",
  },
});

export const darkMuiTheme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    background: { paper: "#131316", default: "#08080A" },
    text: { primary: "#F2F1EE", secondary: "#A0A0A8" },
    primary: { main: "#D9CFBE" },
    divider: "rgba(244,243,241,0.09)",
  },
});