"use client";

import React, { useState } from "react";

import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Box,
  IconButton,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  CircularProgress,
} from "@mui/material";

import PublicIcon from "@mui/icons-material/Public";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";

import { signOut, useSession } from "next-auth/react";

export default function Topbar() {
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const open = Boolean(anchorEl);

  const handleOpenMenu = (e) => setAnchorEl(e.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ callbackUrl: "/portal" });
  };

  const userInitial =
    session?.user?.name?.charAt(0)?.toUpperCase() ||
    session?.user?.email?.charAt(0)?.toUpperCase() ||
    "U";

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: "#FFFFFF",
        color: "#1E293B",
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      <Toolbar
        sx={{
          minHeight: "64px !important",
          display: "flex",
          justifyContent: "space-between",
          px: {
            xs: 2,
            sm: 3,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <PublicIcon
              sx={{
                fontSize: 26,
                color: "#4F46E5",
              }}
            />

            <LocationOnIcon
              sx={{
                position: "absolute",
                fontSize: 14,
                color: "#EF4444",
                bottom: 3,
                right: 3,
              }}
            />
          </Box>

          <Box>
            <Typography
              variant="body1"
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: 16,
                lineHeight: 1.2,
                color: "#1E293B",
              }}
            >
              GeoPortal
            </Typography>

            <Typography
              variant="caption"
              sx={{
                display: {
                  xs: "none",
                  sm: "block",
                },
                fontSize: 11,
                color: "#94A3B8",
                lineHeight: 1.2,
              }}
            >
              Web Internal
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Tooltip title="Notifikasi">
            <IconButton
              size="small"
              sx={{
                width: 36,
                height: 36,
                color: "#64748B",
                "&:hover": {
                  bgcolor: "#F1F5F9",
                },
              }}
            >
              <Badge
                color="error"
                variant="dot"
                overlap="circular"
              >
                <NotificationsNoneIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Box
            sx={{
              width: "1px",
              height: 24,
              bgcolor: "#E5E7EB",
              mx: 0.5,
            }}
          />

          <Tooltip title="Akun">
            <Avatar
              onClick={handleOpenMenu}
              sx={{
                width: 32,
                height: 32,
                bgcolor: "#4F46E5",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "0.2s",
                "&:hover": {
                  bgcolor: "#4338CA",
                  transform: "scale(1.05)",
                },
              }}
            >
              {userInitial}
            </Avatar>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  bgcolor: "#FFFFFF",          
                  color: "#1E293B",           
                  boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.2 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#1E293B" }} noWrap>
                {session?.user?.name || "User"}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#64748B" }} noWrap>
                {session?.user?.email || ""}
              </Typography>
            </Box>

            <Divider />

            <MenuItem onClick={handleCloseMenu} sx={{ color: "#1E293B" }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" sx={{ color: "#1E293B" }} />
              </ListItemIcon>
              Profil Saya
            </MenuItem>

            <MenuItem onClick={handleLogout} disabled={loggingOut} sx={{ color: "#EF4444" }}>
              <ListItemIcon>
                {loggingOut ? (
                  <CircularProgress size={16} sx={{ color: "#EF4444" }} />
                ) : (
                  <LogoutIcon fontSize="small" sx={{ color: "#EF4444" }} />
                )}
              </ListItemIcon>
              {loggingOut ? "Keluar..." : "Logout"}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}