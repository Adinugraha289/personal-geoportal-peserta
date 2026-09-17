import { Box, Button, MenuItem, TextField, FormControlLabel, Switch } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

const TambahData2D = ({ form, setForm, submitting, setSubmitting, onSuccess, onClose }) => {
  const { data: session } = useSession();

  const handleCreate = async () => {
    if (!form.layer_name || !form.file) {
      Swal.fire("Lengkapi form", "Nama layer dan file GeoJSON wajib diisi", "warning");
      return;
    }

    const accessToken = session?.accessToken;
    if (!accessToken) {
      Swal.fire("Gagal!", "Access token tidak tersedia.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("layer_name", form.layer_name);
      formData.append("file", form.file);
      formData.append("akses", form.akses);
      formData.append("editable", form.editable);

      const res = await fetch(`/portal/api/katalog-data-2d/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || result.error || "Gagal menyimpan layer");
      }

      Swal.fire("Berhasil", result.message || `Layer "${result.data.layer_name}" berhasil disimpan`, "success");
      onClose();
      onSuccess();
    } catch (err) {
      Swal.fire("Gagal!", err.message || "Terjadi kesalahan saat menyimpan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
      <TextField
        label="Nama Layer"
        fullWidth
        value={form.layer_name}
        onChange={(e) => setForm((f) => ({ ...f, layer_name: e.target.value }))}
        sx={{
          "& .MuiInputBase-input": { color: "#1E1E2D" },
          "& .MuiInputLabel-root": { color: "#6B7280" },
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D1D5DB" },
        }}
      />

      <Button
        component="label"
        variant="outlined"
        startIcon={<UploadFileIcon />}
        sx={{
          textTransform: "none",
          justifyContent: "flex-start",
          py: 1.2,
          borderRadius: 2,
          color: "#1E1E2D",
          borderColor: "#D1D5DB",
        }}
      >
        {form.file ? form.file.name : "Pilih File GeoJSON"}
        <input
          type="file"
          accept=".geojson,application/geo+json,application/json"
          hidden
          onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
        />
      </Button>

      <TextField
        select
        label="Akses"
        fullWidth
        value={form.akses}
        onChange={(e) => setForm((f) => ({ ...f, akses: e.target.value }))}
        sx={{
          "& .MuiInputBase-input": { color: "#1E1E2D" },
          "& .MuiInputLabel-root": { color: "#6B7280" },
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D1D5DB" },
        }}
        slotProps={{
          select: {
            slotProps: {
              paper: { sx: { bgcolor: "#fff", color: "#1E1E2D" } },
            },
          },
        }}
      >
        <MenuItem value="public">Public</MenuItem>
        <MenuItem value="private">Private</MenuItem>
      </TextField>

      <FormControlLabel
        control={
          <Switch
            checked={form.editable === "true"}
            onChange={(e) => setForm((f) => ({ ...f, editable: e.target.checked ? "true" : "false" }))}
            sx={{
              "& .MuiSwitch-track": { borderRadius: 999, bgcolor: "#D1D5DB", opacity: 1 },
              "& .MuiSwitch-thumb": { boxShadow: "0 1px 3px rgba(0,0,0,0.2)" },
              "& .Mui-checked + .MuiSwitch-track": { bgcolor: "#4F46E5 !important", opacity: 1 },
              "& .Mui-checked .MuiSwitch-thumb": { color: "#fff" },
            }}
          />
        }
        label="Editable (WFS-T)"
        sx={{ color: "#1E1E2D", m: 0 }}
      />

      <Button
        onClick={handleCreate}
        variant="contained"
        disabled={submitting}
        sx={{ bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" }, textTransform: "none", fontWeight: 600 }}
      >
        {submitting ? "Menyimpan..." : "Simpan"}
      </Button>
    </Box>
  );
};

export default TambahData2D;