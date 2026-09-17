"use client";

import { Paper, IconButton, Tooltip, Box } from "@mui/material";
import { Add, Remove } from "@mui/icons-material";

const Zoom = ({ map, buttonSize = 40 }) => {
  const zoomIn = () => map?.zoomIn();
  const zoomOut = () => map?.zoomOut();

  const btnSx = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: 0,
    bgcolor: "#0F2A24",
    color: "#F4EFE2",
    "&:hover": { bgcolor: "#16332B" },
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 1.5,
        overflow: "hidden",
        boxShadow: 3,
      }}
    >
      <Tooltip title="Zoom In" placement="left">
        <Paper
          elevation={0}
          component={IconButton}
          onClick={zoomIn}
          sx={{ ...btnSx, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}
        >
          <Add fontSize="small" />
        </Paper>
      </Tooltip>

      <Box sx={{ height: "1px", bgcolor: "rgba(244,239,226,0.15)" }} />

      <Tooltip title="Zoom Out" placement="left">
        <Paper
          elevation={0}
          component={IconButton}
          onClick={zoomOut}
          sx={{ ...btnSx, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }}
        >
          <Remove fontSize="small" />
        </Paper>
      </Tooltip>
    </Box>
  );
};

export default Zoom;