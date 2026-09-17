"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ExploreIcon from "@mui/icons-material/Explore";
import LoginIcon from "@mui/icons-material/Login";
import MapIcon from "@mui/icons-material/Map";
import HomeIcon from "@mui/icons-material/Home";

const menuItems = [
  { label: "Beranda", path: "/", icon: <HomeIcon fontSize="small" /> },
  { label: "Peta", path: "/web-public/peta", icon: <MapIcon fontSize="small" /> },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: { xs: 12, md: 20 },
          left: { xs: 12, md: 32 },
          right: { xs: 12, md: 32 },
          height: { xs: 64, md: 68 },
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, md: 2.5 },
          borderRadius: { xs: 3, md: 5 },
          background: "linear-gradient(90deg, rgba(255,255,255,0.95), rgba(245,247,248,0.88))",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.65)",
          boxShadow: "0 8px 32px rgba(15, 42, 36, 0.18)",
        }}
      >
        {/* Logo */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1.2, cursor: "pointer" }}
          onClick={() => router.push("/web-public")}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2.5,
              background: "linear-gradient(135deg, #0F2A24 0%, #1F5A4C 100%)",
              boxShadow: "0 4px 12px rgba(15,42,36,0.25)",
            }}
          >
            <ExploreIcon sx={{ color: "#FFFFFF", fontSize: 24 }} />
          </Box>

          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography
              sx={{
                fontSize: 17,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: 0.3,
                color: "#0F2A24",
              }}
            >
              GEO<span style={{ color: "#D98E3B" }}>PORTAL</span>
            </Typography>

            <Typography sx={{ fontSize: 9, color: "#6B7280", letterSpacing: 0.4, mt: 0.3 }}>
              Platform Informasi Spasial Indonesia
            </Typography>
          </Box>
        </Box>

        {/* Desktop menu */}
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5 }}>
          {menuItems.map((item) => {
            const active = pathname === item.path;

            return (
              <Button
                key={item.path}
                onClick={() => router.push(item.path)}
                startIcon={item.icon}
                sx={{
                  position: "relative",
                  px: 2,
                  py: 1,
                  minWidth: "auto",
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  textTransform: "none",
                  borderRadius: 2,
                  color: active ? "#D98E3B" : "#334155",
                  backgroundColor: active ? "rgba(217,142,59,0.08)" : "transparent",
                  transition: "all 0.25s ease",
                  "& .MuiButton-startIcon": { color: active ? "#D98E3B" : "#64748B" },
                  "&:hover": { backgroundColor: "rgba(15,42,36,0.06)", color: "#0F2A24" },
                }}
              >
                {item.label}
              </Button>
            );
          })}

          <Divider orientation="vertical" flexItem sx={{ mx: 1.5, borderColor: "rgba(15,42,36,0.12)" }} />

          <Button
            onClick={() => router.push("/login")}
            startIcon={<LoginIcon fontSize="small" />}
            sx={{
              px: 2.2,
              py: 1,
              borderRadius: 2.5,
              fontSize: 13.5,
              fontWeight: 700,
              textTransform: "none",
              color: "#FFFFFF",
              background: "linear-gradient(135deg, #0F2A24, #1E4B40)",
              boxShadow: "0 4px 12px rgba(15,42,36,0.22)",
              transition: "all 0.25s ease",
              "&:hover": {
                transform: "translateY(-1px)",
                background: "linear-gradient(135deg, #163A32, #286452)",
                boxShadow: "0 6px 16px rgba(15,42,36,0.28)",
              },
            }}
          >
            Login
          </Button>
        </Box>

        {/* Mobile menu button */}
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            display: { xs: "flex", md: "none" },
            width: 42,
            height: 42,
            borderRadius: 2,
            color: "#0F2A24",
            backgroundColor: "rgba(15,42,36,0.06)",
            "&:hover": { backgroundColor: "rgba(15,42,36,0.1)" },
          }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Drawer mobile */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: 280, background: "rgba(255,255,255,0.98)", backdropFilter: "blur(16px)" },
        }}
      >
        <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2.5,
              background: "linear-gradient(135deg, #0F2A24, #1F5A4C)",
            }}
          >
            <ExploreIcon sx={{ color: "#FFFFFF" }} />
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 800, color: "#0F2A24" }}>Geoportal</Typography>
            <Typography sx={{ fontSize: 11, color: "#64748B" }}>
              Spatial Information Platform
            </Typography>
          </Box>
        </Box>

        <Divider />

        <List sx={{ px: 1.5, pt: 2 }}>
          {menuItems.map((item) => {
            const active = pathname === item.path;

            return (
              <ListItemButton
                key={item.path}
                onClick={() => {
                  router.push(item.path);
                  setOpen(false);
                }}
                sx={{
                  mb: 0.7,
                  borderRadius: 2,
                  color: active ? "#D98E3B" : "#334155",
                  backgroundColor: active ? "rgba(217,142,59,0.1)" : "transparent",
                  "&:hover": { backgroundColor: "rgba(15,42,36,0.06)" },
                }}
              >
                <Box sx={{ mr: 1.5, display: "flex", color: active ? "#D98E3B" : "#64748B" }}>
                  {item.icon}
                </Box>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 500 }}
                />
              </ListItemButton>
            );
          })}

          <Divider sx={{ my: 2 }} />

          <ListItemButton
            onClick={() => {
              setOpen(false);
              router.push("/login");
            }}
            sx={{
              borderRadius: 2,
              color: "#FFFFFF",
              background: "linear-gradient(135deg, #0F2A24, #1F5A4C)",
              "&:hover": { background: "linear-gradient(135deg, #163A32, #286452)" },
            }}
          >
            <LoginIcon fontSize="small" sx={{ mr: 1.5 }} />
            <ListItemText primary="Login" primaryTypographyProps={{ fontWeight: 700 }} />
          </ListItemButton>
        </List>
      </Drawer>
    </>
  );
}