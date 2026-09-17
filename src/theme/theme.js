"use client";

import { createTheme } from "@mui/material/styles";

export const palette = {
    bg: "#0B1420",
    surface: "#101B29",
    surfaceHover: "#152232",
    line: "#1E2E3F",
    text: "#E7ECE6",
    muted: "#8CA0AA",
    moss: "#5C8B6E",
    mossDim: "#3E5F4B",
    brass: "#C9A227",
    brassDim: "#8A701F",
};

const theme = createTheme({
    palette: {
        mode: "dark",
        background: {
            default: palette.bg,
            paper: palette.surface,
        },
        text: {
            primary: palette.text,
            secondary: palette.muted,
        },
        primary: {
            main: palette.moss,
            dark: palette.mossDim,
        },
        secondary: {
            main: palette.brass,
            dark: palette.brassDim,
        },
        divider: palette.line,
    },
});

export default theme;