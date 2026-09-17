"use client";

import React, { useState } from "react";
import { Box, Typography, Button, CircularProgress, Alert } from "@mui/material";
import { DeleteOutlined } from "@mui/icons-material";

const HapusData = ({ item, handleCloseDelete, getData, accessToken }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleDelete = async () => {
        if (!item?.data_3d_id) {
            setError("ID data tidak ditemukan.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("data_3d_id", item.data_3d_id);

            const response = await fetch("/portal/api/katalog-data-3d/delete", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: formData,
            }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Gagal menghapus data");
            }

            alert("Berhasil menghapus data 3D!");
            handleCloseDelete(); // tutup modal
            getData(); // refresh table katalog
        } catch (err) {
            console.error("Error delete data:", err);
            setError(err.message || "Terjadi kesalahan saat menghapus data.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ textAlign: "center", py: 1 }}>
            <Box
                sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    bgcolor: "#FEE2E2",
                    color: "#EF4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                }}
            >
                <DeleteOutlined sx={{ fontSize: 36 }} />
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1E1E2D", mb: 1 }}>
                Konfirmasi Hapus Data
            </Typography>

            <Typography variant="body2" sx={{ color: "#6B7280", mb: 3 }}>
                Apakah Anda yakin ingin menghapus file <strong>"{item?.nama || "data ini"}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                <Button
                    variant="outlined"
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCloseDelete();
                    }}
                    disabled={loading}
                    sx={{
                        flex: 1,
                        color: "#374151",
                        borderColor: "#D1D5DB",
                        textTransform: "none",
                        borderRadius: 2,
                        cursor: "pointer",
                        "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F3F4F6" },
                    }}
                >
                    Batal
                </Button>

                <Button
                    variant="contained"
                    color="error"
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    sx={{
                        flex: 1,
                        textTransform: "none",
                        borderRadius: 2,
                        boxShadow: "none",
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Ya, Hapus"}
                </Button>
            </Box>
        </Box>
    );
};

export default HapusData;