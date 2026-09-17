"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Box, Typography, Paper, TextField, InputAdornment, Button, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import Swal from "sweetalert2";
import TambahData2D from "./TambahData2D";
import ListData2D from "./ListData2D";

export default function KatalogData2D() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({ layer_name: "", file: null, akses: "private", editable: "false" });

  const handleOpenCreate = () => {
    setForm({ layer_name: "", file: null, akses: "private", editable: "false" });
    setOpenCreate(true);
  };

  const handleDelete = async (row) => {
      const confirm = await Swal.fire({
        title: `Hapus "${row.layer_name}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, hapus",
        cancelButtonText: "Batal",
        confirmButtonColor: "#DC2626",
      });
      if (!confirm.isConfirmed) return;

      const accessToken = session?.accessToken;
      if (!accessToken) {
        Swal.fire("Gagal!", "Access token tidak tersedia.", "error");
        return;
      }

      try {
        const res = await fetch(`/portal/api/katalog-data-2d/delete?data_2d_id=${row.data_2d_id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.message || result.error || "Gagal menghapus layer");
        }

        Swal.fire("Terhapus", result.message || "Layer berhasil dihapus", "success");
        setRefreshKey((k) => k + 1);
      } catch (err) {
        Swal.fire("Gagal!", err.message || "Terjadi kesalahan saat menghapus", "error");
      }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: "#1E1E2D" }}>Katalog Data 2D</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" }, borderRadius: 2, textTransform: "none", fontWeight: 600, px: 2.5 }}
        >
          Tambah Layer
        </Button>
      </Box>

      <TextField
        placeholder="Cari nama layer..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{
          mb: 2, width: 320, bgcolor: "#1E1E2D", borderRadius: 2,
          "& .MuiOutlinedInput-notchedOutline": { border: "none" },
          "& .MuiInputBase-input": { color: "#fff" },
          "& .MuiInputBase-input::placeholder": { color: "#E5E7EB", opacity: 1 },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "#E5E7EB" }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Paper sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid #EEF0F4", boxShadow: "0 1px 2px rgba(16,24,40,0.06)" }}>
        <ListData2D key={refreshKey} search={search} onDelete={handleDelete} />
      </Paper>

      <Dialog
        open={openCreate}
        onClose={() => !submitting && setOpenCreate(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { bgcolor: "#fff", color: "#1E1E2D", borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#1E1E2D" }}>Tambah Layer Data 2D</DialogTitle>
        <DialogContent>
          <TambahData2D
            form={form}
            setForm={setForm}
            submitting={submitting}
            setSubmitting={setSubmitting}
            onClose={() => setOpenCreate(false)}
            onSuccess={() => setRefreshKey((k) => k + 1)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenCreate(false)} disabled={submitting} sx={{ textTransform: "none", color: "#6B7280" }}>
            Batal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}