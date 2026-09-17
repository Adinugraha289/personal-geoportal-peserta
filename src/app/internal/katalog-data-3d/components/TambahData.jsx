"use client";

import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

const TambahData = ({ form, setForm, handleCloseCreate, getData, accessToken }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [centerPoint, setCenterPoint] = useState([-6.2088, 106.8456]);

    // Inisialisasi Leaflet di Client-Side saja untuk mencegah SSR Error
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        let isMounted = true;

        import("leaflet").then((L) => {
            if (!isMounted || !mapRef.current) return;

            // Fix default icon path issue Leaflet di Next.js
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            });

            const map = L.map(mapRef.current).setView(centerPoint, 13);
            mapInstanceRef.current = map;

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
            }).addTo(map);

            markerRef.current = L.marker(centerPoint).addTo(map);

            // Menyesuaikan ukuran peta saat berada di dalam Modal MUI
            setTimeout(() => {
                map.invalidateSize();
            }, 200);

            map.on("click", (e) => {
                const { lat, lng } = e.latlng;
                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                } else {
                    markerRef.current = L.marker([lat, lng]).addTo(map);
                }

                setCenterPoint([lat, lng]);

                if (setForm) {
                    setForm((prev) => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng,
                    }));
                }
            });
        });

        return () => {
            isMounted = false;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    const handleSubmitData = async () => {
        try {
            if (!form?.file) {
                alert("Silakan pilih file 3D terlebih dahulu!");
                return;
            }

            const formData = new FormData();
            formData.append("file", form.file);
            formData.append("nama", form.nama || "");
            formData.append("akses", form.akses || "public");
            formData.append("latitude", form.latitude || centerPoint[0]);
            formData.append("longitude", form.longitude || centerPoint[1]);
            formData.append("heading", 0);
            formData.append("pitch", 0);
            formData.append("roll", 0);

            const response = await fetch("/portal/api/katalog-data-3d/create", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Gagal menyimpan data");
            }

            alert("Berhasil menambah data 3D!");
            handleCloseCreate(); // tutup modal
            getData(); // refresh table katalog
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, mt: 1 }}>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2.5,
                    mt: 1,
                    flex: 1,
                }}
            >
                {/* Nama Layer */}
                <TextField
                    label="Nama Layer"
                    fullWidth
                    value={form?.nama || ""}
                    onChange={(e) =>
                        setForm &&
                        setForm((f) => ({
                            ...f,
                            nama: e.target.value,
                        }))
                    }
                    sx={{
                        "& .MuiInputBase-input": { color: "#1F2937" },
                        "& .MuiInputLabel-root": { color: "#6B7280" },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#1976D2" },
                        "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: "#BFC5CC" },
                            "&:hover fieldset": { borderColor: "#1976D2" },
                            "&.Mui-focused fieldset": { borderColor: "#1976D2" },
                        },
                    }}
                />

                {/* Upload File */}
                <Button
                    component="label"
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    sx={{
                        textTransform: "none",
                        justifyContent: "flex-start",
                        py: 1.2,
                        borderRadius: 2,
                        color: "#4B5563",
                        borderColor: "#AFC8B8",
                        "&:hover": {
                            borderColor: "#388E3C",
                            backgroundColor: "#F5FAF6",
                        },
                    }}
                >
                    <Typography
                        noWrap
                        sx={{ fontSize: 14, maxWidth: "220px", textOverflow: "ellipsis" }}
                    >
                        {form?.file ? form.file.name : "Pilih File 3D (.glb)"}
                    </Typography>

                    <input
                        type="file"
                        accept=".glb,.zip"
                        hidden
                        onChange={(e) =>
                            setForm &&
                            setForm((f) => ({
                                ...f,
                                file: e.target.files?.[0] || null,
                            }))
                        }
                    />
                </Button>

                {/* Hak Akses */}
                <TextField
                    select
                    label="Akses"
                    fullWidth
                    value={form?.akses || "public"}
                    onChange={(e) =>
                        setForm &&
                        setForm((f) => ({
                            ...f,
                            akses: e.target.value,
                        }))
                    }
                    sx={{
                        "& .MuiInputBase-input": { color: "#1F2937" },
                        "& .MuiSelect-select": { color: "#1F2937" },
                        "& .MuiInputLabel-root": { color: "#6B7280" },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#1976D2" },
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#BFC5CC" },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#1976D2" },
                        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#1976D2",
                        },
                        "& .MuiSelect-icon": { color: "#6B7280" },
                    }}
                >
                    <MenuItem value="public">Public</MenuItem>
                    <MenuItem value="private">Private</MenuItem>
                </TextField>

                {/* Tombol Aksi */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-end",
                        gap: "10px",
                    }}
                >
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleCloseCreate}
                        sx={{ textTransform: "none" }}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        color="info"
                        onClick={handleSubmitData}
                        sx={{ textTransform: "none" }}
                    >
                        Submit
                    </Button>
                </Box>
            </Box>

            {/* Peta Pemilihan Lokasi */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    alignItems: "center",
                }}
            >
                <Box
                    sx={{
                        width: { xs: "100%", md: "300px" },
                        height: "250px",
                        borderRadius: 2,
                        overflow: "hidden",
                        border: "1px solid #E5E7EB",
                    }}
                    ref={mapRef}
                />

                <Typography variant="caption" sx={{ color: "#6B7280" }}>
                    <b>Lat:</b> {centerPoint[0].toFixed(6)}, <b>Lng:</b> {centerPoint[1].toFixed(6)}
                </Typography>
            </Box>
        </Box>
    );
};

export default TambahData;