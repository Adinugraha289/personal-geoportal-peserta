"use client";

import { Box, Container, Typography, Button, Stack, Chip } from "@mui/material";
import ExploreIcon from "@mui/icons-material/Explore";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import LayersIcon from "@mui/icons-material/Layers";
import ApartmentIcon from "@mui/icons-material/Apartment";
import DatasetIcon from "@mui/icons-material/Dataset";

const STATS = [
  { icon: <DatasetIcon fontSize="small" />, value: "500+", label: "Dataset Spasial" },
  { icon: <LayersIcon fontSize="small" />, value: "40+", label: "Layer Peta" },
  { icon: <ApartmentIcon fontSize="small" />, value: "20+", label: "Instansi Terhubung" },
];

export default function Beranda() {
  return (
    <Box sx={{ height: "100dvh", overflow: "hidden" }}>
      <Box
        sx={{
          position: "relative",
          height: "100%",
          bgcolor: "#0F2A24",
          color: "#F4EFE2",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Dekorasi titik ala peta */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.5,
            backgroundImage:
              "repeating-radial-gradient(circle at 15% 25%, transparent 0px, transparent 22px, rgba(244,239,226,0.06) 23px, rgba(244,239,226,0.06) 24px), " +
              "repeating-radial-gradient(circle at 85% 75%, transparent 0px, transparent 30px, rgba(244,239,226,0.05) 31px, rgba(244,239,226,0.05) 32px)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.4,
            backgroundImage:
              "linear-gradient(rgba(244,239,226,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(244,239,226,0.05) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            display: { xs: "none", md: "block" },
          }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(15,42,36,0.35) 0%, rgba(15,42,36,0.9) 100%)",
          }}
        />

        <ExploreIcon
          sx={{
            position: "absolute",
            top: { xs: -30, md: -20 },
            right: { xs: -30, md: 60 },
            fontSize: { xs: 180, md: 280 },
            color: "rgba(244,239,226,0.05)",
            transform: "rotate(-12deg)",
            display: { xs: "none", sm: "block" },
          }}
        />

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: { xs: 34, md: 56 },
              lineHeight: 1.1,
              maxWidth: 640,
            }}
          >
            Portal Informasi Geospasial Publik
          </Typography>

          <Box sx={{ width: 64, height: 2, bgcolor: "#D98E3B", my: 3 }} />

          <Typography sx={{ opacity: 0.85, mb: 4, maxWidth: 480, fontSize: 16, lineHeight: 1.6 }}>
            Akses data dan peta geospasial resmi untuk mendukung transparansi dan
            pengambilan keputusan berbasis lokasi.
          </Typography>

          <Stack
            direction="row"
            spacing={{ xs: 3, md: 5 }}
            divider={
              <Box sx={{ width: "1px", bgcolor: "rgba(244,239,226,0.15)" }} />
            }
          >
            {STATS.map((stat) => (
              <Box key={stat.label} sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(244,239,226,0.08)",
                    color: "#D98E3B",
                    flexShrink: 0,
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: { xs: 16, md: 20 }, fontWeight: 700, lineHeight: 1.2 }}>
                    {stat.value}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: 10.5, md: 12 }, opacity: 0.7 }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}