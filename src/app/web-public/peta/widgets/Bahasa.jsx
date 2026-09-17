"use client";

import { Paper, IconButton, Tooltip } from "@mui/material";

const Bahasa = ({ buttonSize = 40, tooltip = "left", bahasa, setBahasa }) => {
  const handleSwitchBahasa = () => {
    setBahasa(bahasa === "ID" ? "EN" : "ID");
  };

  return (
    <Tooltip title={bahasa === "ID" ? "EN" : "ID"} placement={tooltip}>
      <Paper
        elevation={3}
        component={IconButton}
        onClick={handleSwitchBahasa}
        sx={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: 1.5,
          fontSize: "0.8rem",
          fontWeight: 700,
          bgcolor: "#0F2A24",
          color: "#F4EFE2",
          "&:hover": { bgcolor: "#16332B" },
        }}
      >
        {bahasa === "ID" ? "ID" : "EN"}
      </Paper>
    </Tooltip>
  );
};

export default Bahasa;