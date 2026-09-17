"use client";

import { useCallback } from "react";
import { Paper, IconButton, Tooltip } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

const HOME_COORDS = { lat: -6.175392, lng: 106.827153, zoom: 15 };

export default function Home({ map, markerRef }) {
  const handleHome = useCallback(() => {
    if (!map) return;
    map.flyTo([HOME_COORDS.lat, HOME_COORDS.lng], HOME_COORDS.zoom, {
      duration: 1,
    });
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  }, [map, markerRef]);

  return (
    <Tooltip title="Kembali ke Beranda Peta" placement="left">
      <Paper
        elevation={3}
        component={IconButton}
        onClick={handleHome}
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          bgcolor: "#0F2A24",
          color: "#F4EFE2",
          "&:hover": { bgcolor: "#16332B" },
        }}
      >
        <HomeIcon fontSize="small" />
      </Paper>
    </Tooltip>
  );
}