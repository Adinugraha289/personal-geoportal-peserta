"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Table, TableHead, TableBody, TableRow, TableCell, Box, Typography,
  Avatar, Chip, IconButton, Tooltip, CircularProgress, Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import LayersIcon from "@mui/icons-material/Layers";

const ListData2D = ({ search, onDelete }) => {
  const { data: session, status } = useSession();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (signal) => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/portal/api/katalog-data-2d/list", {
        signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      setData(result.data || []);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setError("Anda belum login. Silakan login terlebih dahulu.");
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [status, fetchData]);

  const filtered = data.filter((d) =>
    (d.layer_name || "").toLowerCase().includes((search || "").toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <Table>
      <TableHead>
        <TableRow
          sx={{
            "& .MuiTableCell-root": {
              bgcolor: "#1E1E2D", color: "#fff", fontWeight: 600, fontSize: 13,
              textTransform: "uppercase", letterSpacing: 0.3, border: "none",
            },
          }}
        >
          <TableCell>Layer Name</TableCell>
          <TableCell>Akses</TableCell>
          <TableCell>Editable</TableCell>
          <TableCell>WMS / WFS</TableCell>
          <TableCell>Author</TableCell>
          <TableCell align="right">Aksi</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {filtered.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <LayersIcon sx={{ fontSize: 32, color: "#D1D5DB" }} />
                <Typography variant="body2" sx={{ color: "#1E1E2D" }}>
                  {search ? "Tidak ada layer yang cocok" : "Belum ada data"}
                </Typography>
              </Box>
            </TableCell>
          </TableRow>
        )}

        {filtered.map((row, idx) => (
          <TableRow
            key={row.data_2d_id}
            sx={{
              bgcolor: "#fff",
              "&:hover": { bgcolor: "#F9FAFB" },
              "& .MuiTableCell-root": {
                color: "#1E1E2D",
                borderBottom: idx === filtered.length - 1 ? "none" : "1px solid #EEF0F4",
              },
            }}
          >
            <TableCell>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: "#EEF2FF", color: "#4F46E5" }}>
                  <LayersIcon sx={{ fontSize: 16 }} />
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 500, color: "#1E1E2D" }}>
                  {row.layer_name}
                </Typography>
              </Box>
            </TableCell>
            <TableCell>
              <Chip
                label={row.akses}
                size="small"
                sx={{
                  borderRadius: 1.5, fontWeight: 600, textTransform: "capitalize",
                  bgcolor: row.akses === "public" ? "#ECFDF5" : "#FEF2F2",
                  color: row.akses === "public" ? "#059669" : "#DC2626",
                }}
              />
            </TableCell>
            <TableCell>
              <Chip
                label={row.is_editable ? "Ya" : "Tidak"}
                size="small"
                variant="outlined"
                sx={{ borderRadius: 1.5, fontWeight: 600, color: "#1E1E2D", borderColor: "#D1D5DB" }}
              />
            </TableCell>
            <TableCell sx={{ maxWidth: 260 }}>
              <Tooltip title={row.wms_url}>
                <Typography noWrap variant="body2" sx={{ maxWidth: 240, color: "#1E1E2D" }}>
                  {row.wms_url}
                </Typography>
              </Tooltip>
            </TableCell>
            <TableCell>
              <Typography variant="body2" sx={{ color: "#1E1E2D" }}>
                {row.users?.email || "-"}
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Tooltip title="Hapus layer">
                <IconButton size="small" onClick={() => onDelete(row)} sx={{ color: "#DC2626" }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ListData2D;