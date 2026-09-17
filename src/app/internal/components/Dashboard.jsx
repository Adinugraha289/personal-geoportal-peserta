"use client";
import { Grid, Paper, Typography, Box } from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import MapIcon from "@mui/icons-material/Map";
import GroupIcon from "@mui/icons-material/Group";

const stats = [
  { label: "Total Data", value: 128, icon: <StorageIcon />, color: "#4F46E5", bg: "#EEF2FF" },
  { label: "Total Peta", value: 42, icon: <MapIcon />, color: "#16A34A", bg: "#ECFDF3" },
  { label: "Total Akun", value: 15, icon: <GroupIcon />, color: "#F59E0B", bg: "#FFFBEB" },
];

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3} sx={{ color: "#1E1E2D" }}>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {stats.map((s) => (
          <Grid key={s.label} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              sx={{
                p: 3, display: "flex", alignItems: "center", gap: 2, borderRadius: 3,
                border: "1px solid #EEF0F4", boxShadow: "0 1px 2px rgba(16,24,40,0.06)",
              }}
            >
              <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.icon}
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>{s.value}</Typography>
                <Typography color="text.secondary" fontSize={14}>{s.label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}