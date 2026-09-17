"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Typography, Avatar,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LayersIcon from "@mui/icons-material/Layers";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import MapIcon from "@mui/icons-material/Map";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import { ViewInAr } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const drawerWidth = 260;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const menuItems = [
      { label: "Katalog Data 2D", path: "/internal/katalog-data-2d", icon: <LayersIcon /> },
      { label: "Katalog Data 3D", path: "/internal/katalog-data-3d", icon: <ViewInArIcon /> },
      { label: "Gaussian Splatting", path: "/internal/splatting", icon: <ViewInAr /> }
    ]
    if (session.data.user.role === "super_admin") {
      menuItems.push({ label: "Kelola Akun", path: "/internal/kelola-akun", icon: <ManageAccountsIcon /> })
    }
    setMenuItems(menuItems);
  }, [session?.data?.user?.role]);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box", borderRight: "1px solid #EEF0F4" },
      }}
    >
      <Toolbar sx={{ px: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ bgcolor: "#4F46E5", width: 34, height: 34, fontSize: 16 }}>WI</Avatar>
          <Typography variant="subtitle1" fontWeight={700}>Web Internal</Typography>
        </Box>
      </Toolbar>
      <List sx={{ mt: 1 }}>
        {menuItems.map((item) => {
          const active = pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              selected={active}
              onClick={() => router.push(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                mb: 0.3,
                "&.Mui-selected": {
                  bgcolor: "#EEF2FF",
                  color: "#4F46E5",
                  "& .MuiListItemIcon-root": { color: "#4F46E5" },
                  "&:hover": { bgcolor: "#E0E7FF" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: { fontSize: 14, fontWeight: active ? 600 : 500 },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}