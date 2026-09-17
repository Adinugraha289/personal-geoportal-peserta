import { Box } from "@mui/material";

import Navbar from "./components/Navbar";

export default function WebPublicLayout({ children }) {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <Navbar />

      <Box
        component="main"
        sx={{
          width: "100%",
          minHeight: "100vh",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}