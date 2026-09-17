"use client";

import { useState, useEffect } from "react";
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
  Chip,
  IconButton,
  Tooltip,
  Link,
  Modal,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import TambahData from "./TambahData";
import { Close, Visibility } from "@mui/icons-material";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import HapusData from "./HapusData";

const PreviewCesiumModal = dynamic(
  () => import("./PreviewCesiumModal"),
  { ssr: false }
);

export default function KatalogData3D() {
  // Inisialisasi state awal dengan array kosong
  const [tableData, setTableData] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [focusItem, setFocusItem] = useState(null);

  const [openPreview, setOpenPreview] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [form, setForm] = useState({ nama: "", file: null, akses: "public" });

  const session = useSession();

  // Fungsi Fetch Data dari Client Side
  const getData = async () => {
    try {
      const res = await fetch("/portal/api/katalog-data-3d/list", {
        headers: {
          Authorization: `Bearer ${session?.data?.accessToken}`,
        },
      });

      if (res.ok) {
        const result = await res.json();
        setTableData(result.data || result);
      }
    } catch (err) {
      console.error("Gagal mengambil data tabel:", err);
    }
  };

  // 1. Trigger Fetch Awal saat Komponen Di-mount / Token Siap
  useEffect(() => {
    if (session?.data?.accessToken) {
      getData();
    }
  }, [session?.data?.accessToken]);

  // 2. Handling Pencarian dan Filter Data
  useEffect(() => {
    if (!search.trim()) {
      setFilteredData(tableData);
      return;
    }
    const query = search.toLowerCase();
    const result = (tableData || []).filter((item) => {
      return item.nama?.toLowerCase().includes(query);
    });
    setFilteredData(result);
  }, [search, tableData]);

  const handleOpenAdd = () => {
    setForm({ nama: "", file: null, akses: "public" });
    setOpenAdd(true);
  };

  const handleCloseAdd = () => {
    setForm({ nama: "", file: null, akses: "public" });
    setOpenAdd(false);
  };

  const handleOpenPreview = (item) => {
    setOpenPreview(true);
    setFocusItem(item);
  };

  const handleClosePreview = () => {
    setOpenPreview(false);
    setFocusItem(null);
  };

  const handleOpenDelete = (item) => {
    setOpenDelete(true)
    setFocusItem(item)
  }

  const handleCloseDelete = () => {
    setOpenDelete(false)
    setFocusItem(null);
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
          Katalog Data 3D
        </Typography>


      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, height: "40px" }}>
        {/* Search Input */}
        <TextField
          placeholder="Cari nama layer..."
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
        {session?.data?.user?.role !== "viewer" ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
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
            Tambah Layer 3D
          </Button>
        ) : null}
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
              <TableCell>Nama Layer</TableCell>
              <TableCell>URL File (.GLB)</TableCell>
              <TableCell>Koordinat (Lat, Long)</TableCell>
              <TableCell>Pembuat</TableCell>
              <TableCell>Akses</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData?.length > 0 ? (
              filteredData.map((row) => (
                <TableRow
                  key={row.data_3d_id}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell sx={{ fontWeight: 600, color: "#111827" }}>
                    {row.nama}
                  </TableCell>

                  <TableCell>
                    <Link
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      sx={{
                        color: "#4F46E5",
                        maxWidth: 220,
                        display: "inline-block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        verticalAlign: "middle",
                      }}
                    >
                      {row.url}
                    </Link>
                  </TableCell>

                  <TableCell sx={{ color: "#4B5563", fontSize: 13 }}>
                    {row.latitude?.toFixed(4)}, {row.longitude?.toFixed(4)}
                  </TableCell>

                  <TableCell sx={{ color: "#374151" }}>
                    {row.users?.email || "-"}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={(row.akses || "private").toUpperCase()}
                      size="small"
                      color={row.akses === "public" ? "success" : "default"}
                      variant={row.akses === "public" ? "filled" : "outlined"}
                      sx={{ fontWeight: 600, fontSize: 11 }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip title="Preview di Cesium">
                      <IconButton size="small" color="primary" onClick={() => handleOpenPreview(row)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {session?.data?.user?.role !== "viewer" ? (
                      <>
                        <Tooltip title="Edit Metadata">
                          <IconButton size="small" color="info">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hapus Layer">
                          <IconButton size="small" color="error" onClick={() => handleOpenDelete(row)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    {search
                      ? "Tidak ada data 3D yang sesuai dengan pencarian."
                      : "Belum ada katalog data 3D."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Modal Form Tambah Data */}
      <Modal open={openAdd} onClose={handleCloseAdd}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 600, md: 700 },
            bgcolor: "#fff",
            color: "#1E1E2D",
            borderRadius: 3,
            boxShadow: 24,
            p: 3,
            outline: "none",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography id="modal-tambah-data-3d" variant="h6" sx={{ fontWeight: 700, color: "#1E1E2D" }}>
              Tambah Layer Data 3D
            </Typography>
            <IconButton onClick={handleCloseAdd} size="small" sx={{ color: "#6B7280" }}>
              <Close />
            </IconButton>
          </Box>

          <TambahData
            form={form}
            setForm={setForm}
            handleCloseAdd={handleCloseAdd}
            getData={getData}
            accessToken={session?.data?.accessToken}
          />
        </Box>
      </Modal>

      {/* Modal Preview Cesium */}
      <Modal open={openPreview} onClose={handleClosePreview}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 600, md: 700 },
            bgcolor: "#fff",
            color: "#1E1E2D",
            borderRadius: 3,
            boxShadow: 24,
            p: 3,
            outline: "none",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography id="modal-tambah-data-3d" variant="h6" sx={{ fontWeight: 700, color: "#1E1E2D" }}>
              Tambah Layer Data 3D
            </Typography>
            <IconButton onClick={handleClosePreview} size="small" sx={{ color: "#6B7280" }}>
              <Close />
            </IconButton>
          </Box>
          <PreviewCesiumModal
            openPreview={openPreview}
            onClose={handleClosePreview}
            item={focusItem}
          />
        </Box>
      </Modal>

      {/* Modal Hapus Data */}
      <Modal open={openDelete} onClose={handleCloseDelete} >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 450, md: 500 },
            bgcolor: "#fff",
            color: "#1E1E2D",
            borderRadius: 3,
            boxShadow: 24,
            p: 3,
            outline: "none",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <IconButton onClick={handleCloseDelete} size="small" sx={{ color: "#6B7280" }}>
              <Close />
            </IconButton>
          </Box>

          <HapusData
            item={focusItem}
            accessToken={session?.data?.accessToken}
            getData={getData}
            handleCloseDelete={handleCloseDelete}
          />
        </Box>
      </Modal>
    </Box>
  );
}