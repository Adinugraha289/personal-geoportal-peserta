"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Chip,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useSession } from "next-auth/react";
// Daftar peran diambil dari lib/auth/roles.js supaya halaman ini dan API
// memakai daftar yang sama. Sebelumnya halaman ini menawarkan "Super Admin"
// pada dialog Edit, padahal API menolaknya dengan 400 Role tidak valid.
import {
  ROLE_DAPAT_DIBUAT,
  ROLE_DAPAT_DIUBAH,
  ROLE_BAWAAN,
} from "../../../../lib/auth/roles";

// Nama peran yang enak dibaca, untuk ditampilkan pada pilihan.
const LABEL_PERAN = {
  viewer: "Viewer",
  admin: "Admin",
  super_admin: "Super Admin",
};

export default function KelolaAkun() {
  const { data: session, status } = useSession();
  const [akuns, setAkuns] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Search & Filter
  const [search, setSearch] = useState("");
  const [filteredAkuns, setFilteredAkuns] = useState([]);

  // State Modal Tambah Akun
  const [openTambah, setOpenTambah] = useState(false);
  const [newNama, setNewNama] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState(ROLE_BAWAAN);
  const [newIsActive, setNewIsActive] = useState(true);

  // State Modal Hapus Akun
  const [openHapus, setOpenHapus] = useState(false);
  const [hapusTarget, setHapusTarget] = useState(null);

  // State Modal Edit
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Function Fetch List Akun
  const fetchAkuns = async () => {
    if (session?.user?.role === "super_admin" && session?.accessToken) {
      try {
        const response = await fetch("/portal/api/users/list", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        const resJson = await response.json();
        setAkuns(resJson.data || []);
      } catch (error) {
        console.error("Gagal mengambil data user:", error);
      } finally {
        setLoading(false);
      }
    } else if (status !== "loading") {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAkuns();
  }, [session, status]);

  // Handling Search Filter
  useEffect(() => {
    if (!search.trim()) {
      setFilteredAkuns(akuns);
      return;
    }
    const query = search.toLowerCase();
    const result = (akuns || []).filter((item) => {
      return (
        item.nama?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.role?.toLowerCase().includes(query)
      );
    });
    setFilteredAkuns(result);
  }, [search, akuns]);

  const handleOpenTambah = () => {
    setNewNama("");
    setNewEmail("");
    setNewPassword("");
    setNewRole(ROLE_BAWAAN);
    setNewIsActive(true);
    setOpenTambah(true);
  };

  const handleCloseTambah = () => {
    if (submitting) return;
    setOpenTambah(false);
  };

  const handleSubmitTambah = async () => {
    // Diperiksa di sini juga, supaya pesannya jelas sebelum sampai ke API.
    if (!newNama.trim() || !newEmail.trim() || !newPassword) {
      alert("Nama, email, dan kata sandi wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/portal/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          nama: newNama.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
          is_active: newIsActive,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Gagal menambah akun");
      }

      alert("Berhasil menambah akun!");
      setOpenTambah(false);
      fetchAkuns();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenHapus = (user) => {
    setHapusTarget(user);
    setOpenHapus(true);
  };

  const handleCloseHapus = () => {
    if (submitting) return;
    setOpenHapus(false);
  };

  const handleConfirmHapus = async () => {
    if (!hapusTarget) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/portal/api/users/delete?user_id=${hapusTarget.user_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Gagal menghapus akun");
      }

      alert("Berhasil menghapus akun!");
      setOpenHapus(false);
      fetchAkuns();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditIsActive(user.is_active);
    setOpenEdit(true);
  };

  const handleCloseEdit = () => {
    if (submitting) return;
    setOpenEdit(false);
    setSelectedUser(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    setSubmitting(true);

    try {
      // Metode PATCH, sama dengan yang diekspor endpoint users/update dan
      // sama dengan koleksi Postman. Sebelumnya POST, sehingga setelah
      // endpoint dibetulkan menjadi PATCH, penyimpanan dari halaman ini
      // menerima 405 dan perubahan tidak tersimpan.
      const response = await fetch("/portal/api/users/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          role: editRole,
          is_active: editIsActive,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        await fetchAkuns();
        handleCloseEdit();
      } else {
        alert(result.message || "Gagal memperbarui user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Terjadi kesalahan pada server");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h5" fontWeight={700} sx={{ color: "#1E1E2D" }}>
          Kelola Akun
        </Typography>
      </Box>

      {/* Control Section (Search & Add Button) */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, height: "40px" }}>
        <TextField
          placeholder="Cari nama, email, atau role..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            mb: 2,
            height: "100%",
            width: 320,
            bgcolor: "#1E1E2D",
            borderRadius: 2,
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            "& .MuiInputBase-input": { color: "#fff" },
            "& .MuiInputBase-input::placeholder": { color: "#E5E7EB", opacity: 0.8 },
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

        {session?.user?.role === "super_admin" && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenTambah}
            sx={{
              height: "100%",
              bgcolor: "#4F46E5",
              "&:hover": { bgcolor: "#4338CA" },
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
            }}
          >
            Tambah Akun
          </Button>
        )}
      </Box>

      {/* Data Table */}
      <Paper
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(16,24,40,0.1)",
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                "& .MuiTableCell-root": {
                  bgcolor: "#1E1E2D",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  letterSpacing: 0.3,
                },
              }}
            >
              <TableCell>Nama</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredAkuns?.length > 0 ? (
              filteredAkuns.map((row) => (
                <TableRow
                  key={row.user_id}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "#818CF8", color: "#fff" }}>
                        {row.nama ? row.nama.charAt(0).toUpperCase() : "U"}
                      </Avatar>
                      <Typography fontSize={14} fontWeight={600} sx={{ color: "#111827" }}>
                        {row.nama}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell sx={{ color: "#374151" }}>{row.email}</TableCell>

                  <TableCell sx={{ color: "#4B5563", fontSize: 13, textTransform: "capitalize" }}>
                    {row.role}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={row.is_active ? "AKTIF" : "NON-AKTIF"}
                      size="small"
                      color={row.is_active ? "success" : "default"}
                      variant={row.is_active ? "filled" : "outlined"}
                      sx={{ fontWeight: 600, fontSize: 11 }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip title="Edit Akun">
                      <span>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleOpenEdit(row)}
                          disabled={row.role === "super_admin"}
                          sx={{
                            "&:disabled": { color: "#9CA3AF" },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title="Hapus Akun">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenHapus(row)}
                          disabled={row.role === "super_admin"}
                          sx={{
                            "&:disabled": { color: "#9CA3AF" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    {search
                      ? "Tidak ada akun yang sesuai dengan pencarian."
                      : "Belum ada data akun."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Modal Tambah Akun */}
      <Dialog
        open={openTambah}
        onClose={handleCloseTambah}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, color: "#1E1E2D" }}>
          Tambah Akun
        </DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}>
          <TextField
            label="Nama"
            value={newNama}
            onChange={(e) => setNewNama(e.target.value)}
            fullWidth
            size="small"
            variant="outlined"
          />

          <TextField
            label="Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            fullWidth
            size="small"
            variant="outlined"
          />

          <TextField
            label="Kata Sandi"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            size="small"
            variant="outlined"
            helperText="Minimal 8 karakter. Sampaikan kepada pemilik akun."
          />

          <FormControl fullWidth size="small">
            <InputLabel id="tambah-role-label">Role</InputLabel>
            <Select
              labelId="tambah-role-label"
              value={newRole}
              label="Role"
              onChange={(e) => setNewRole(e.target.value)}
            >
              {ROLE_DAPAT_DIBUAT.map((peran) => (
                <MenuItem key={peran} value={peran}>
                  {LABEL_PERAN[peran] || peran}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={newIsActive}
                onChange={(e) => setNewIsActive(e.target.checked)}
              />
            }
            label={newIsActive ? "Aktif" : "Belum aktif"}
          />

          <Typography variant="caption" sx={{ color: "#6B7280" }}>
            Akun yang belum aktif dapat login, tetapi ditolak dengan pesan
            permintaan aktivasi. Hubungi admin untuk mengaktifkannya.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseTambah} disabled={submitting} sx={{ color: "#6B7280" }}>
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitTambah}
            disabled={submitting}
            sx={{ bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" }, textTransform: "none" }}
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Hapus Akun */}
      <Dialog
        open={openHapus}
        onClose={handleCloseHapus}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, color: "#1E1E2D" }}>
          Hapus Akun
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ color: "#1E1E2D" }}>
            Akun berikut akan dihapus:
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 600, color: "#1E1E2D" }}>
            {hapusTarget?.nama || "-"}
          </Typography>
          <Typography variant="body2" sx={{ color: "#6B7280" }}>
            {hapusTarget?.email || "-"}
          </Typography>
          <Typography variant="caption" sx={{ display: "block", mt: 2, color: "#B91C1C" }}>
            Tindakan ini tidak dapat dibatalkan. Akun yang masih memiliki katalog
            tidak dapat dihapus, karena kolom author memakai aturan ON DELETE RESTRICT.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseHapus} disabled={submitting} sx={{ color: "#6B7280" }}>
            Batal
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmHapus}
            disabled={submitting}
            sx={{ textTransform: "none" }}
          >
            {submitting ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Edit Akun */}
      <Dialog
        open={openEdit}
        onClose={handleCloseEdit}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, color: "#1E1E2D" }}>
          Edit Akun User
        </DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}>
          <TextField
            label="Email"
            value={selectedUser?.email || ""}
            disabled
            fullWidth
            size="small"
            variant="outlined"
          />

          <FormControl fullWidth size="small">
            <InputLabel id="edit-role-label">Role</InputLabel>
            <Select
              labelId="edit-role-label"
              value={editRole}
              label="Role"
              onChange={(e) => setEditRole(e.target.value)}
            >
              {ROLE_DAPAT_DIUBAH.map((peran) => (
                <MenuItem key={peran} value={peran}>
                  {LABEL_PERAN[peran] || peran}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                color="primary"
              />
            }
            label={editIsActive ? "Status: Aktif" : "Status: Non-Aktif"}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEdit} disabled={submitting} sx={{ color: "#6B7280" }}>
            Batal
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={submitting}
            disableElevation
            sx={{ bgcolor: "#4F46E5", "&:hover": { bgcolor: "#3730A3" } }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : "Simpan Perubahan"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}