"use client";

import { useEffect, useState } from "react";
import { Paper, IconButton, Tooltip } from "@mui/material";
import { Fullscreen, FullscreenExit } from "@mui/icons-material";

const FullScreen = ({ buttonSize = 40, tooltip = "left" }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(document.fullscreenElement !== null);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  return (
    <Tooltip title="Fullscreen" placement={tooltip}>
      <Paper
        elevation={3}
        component={IconButton}
        onClick={toggleFullScreen}
        sx={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: 1.5,
          bgcolor: "#0F2A24",
          color: "#F4EFE2",
          "&:hover": { bgcolor: "#16332B" },
        }}
      >
        {isFullScreen ? (
          <FullscreenExit fontSize="small" />
        ) : (
          <Fullscreen fontSize="small" />
        )}
      </Paper>
    </Tooltip>
  );
};

export default FullScreen;