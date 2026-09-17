"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Grid, Paper, Typography, Box, Skeleton } from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import MapIcon from "@mui/icons-material/Map";
import GroupIcon from "@mui/icons-material/Group";

// Setiap kartu mengambil angkanya dari API, bukan ditulis di kode. Sebelumnya
// ketiga kartu memuat angka tetap sehingga dashboard menampilkan jumlah yang
// tidak pernah cocok dengan isi database.
//
// Peran yang dibutuhkan tiap endpoint berbeda, jadi satu kartu bisa tidak
// terjangkau oleh sebagian peran. Kartu seperti itu menampilkan keterangan,
// bukan angka nol, supaya tidak terbaca sebagai "datanya kosong":
//
//   katalog-data-2d/list   editor       dan di atasnya
//   katalog-data-3d/list   viewer       dan di atasnya
//   users/list             super_admin  saja
const KARTU = [
  {
    kunci: "data",
    label: "Data Katalog",
    icon: <StorageIcon />,
    color: "#4F46E5",
    bg: "#EEF2FF",
  },
  {
    kunci: "peta",
    label: "Peta Siap Pakai",
    icon: <MapIcon />,
    color: "#16A34A",
    bg: "#ECFDF3",
  },
  {
    kunci: "akun",
    label: "Akun Pengguna",
    icon: <GroupIcon />,
    color: "#F59E0B",
    bg: "#FFFBEB",
  },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [angka, setAngka] = useState(null);
  const [catatan, setCatatan] = useState({});
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setMemuat(false);
      return;
    }

    const token = session?.accessToken;
    const ambil = async (url) => {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const isi = await res.json().catch(() => ({}));
        throw new Error(isi.message || `HTTP ${res.status}`);
      }
      return res.json();
    };

    let dibatalkan = false;

    (async () => {
      const hasil = { data: null, peta: null, akun: null };
      const ket = {};

      const [k2d, k3d] = await Promise.allSettled([
        ambil("/portal/api/katalog-data-2d/list"),
        ambil("/portal/api/katalog-data-3d/list"),
      ]);

      const j2d = k2d.status === "fulfilled" ? (k2d.value.data ?? []).length : null;
      const j3d = k3d.status === "fulfilled" ? (k3d.value.data ?? []).length : null;

      if (j2d === null && j3d === null) {
        setGalat(
          k2d.status === "rejected" ? k2d.reason.message : k3d.reason.message
        );
      } else {
        hasil.data = (j2d ?? 0) + (j3d ?? 0);
        ket.data = `${j2d ?? 0} vektor 2D, ${j3d ?? 0} model 3D`;

        // "Peta siap pakai" hanya menghitung layer katalog 2D yang punya
        // alamat WMS, karena hanya layer itu yang bisa langsung ditampilkan
        // di halaman peta. Model 3D belum menyimpan status terbit.
        const daftar2d = k2d.status === "fulfilled" ? (k2d.value.data ?? []) : [];
        hasil.peta = daftar2d.filter((d) => d.wms_url).length;
        ket.peta =
          j2d === null
            ? "Perlu izin editor"
            : `${hasil.peta} dari ${j2d} layer punya alamat WMS`;
      }

      if (session?.user?.role === "super_admin") {
        try {
          const u = await ambil("/portal/api/users/list");
          const daftar = u.data ?? [];
          hasil.akun = daftar.length;
          const aktif = daftar.filter((x) => x.is_active).length;
          ket.akun = `${aktif} aktif, ${daftar.length - aktif} belum diaktivasi`;
        } catch (e) {
          hasil.akun = null;
          ket.akun = e.message;
        }
      } else {
        ket.akun = "Hanya super admin";
      }

      if (!dibatalkan) {
        setAngka(hasil);
        setCatatan(ket);
        setMemuat(false);
      }
    })();

    return () => {
      dibatalkan = true;
    };
  }, [status, session]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3} sx={{ color: "#1E1E2D" }}>
        Dashboard
      </Typography>

      {galat && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            border: "1px solid #FECACA",
            bgcolor: "#FEF2F2",
            boxShadow: "none",
          }}
        >
          <Typography fontSize={14} sx={{ color: "#991B1B" }}>
            Gagal mengambil data dashboard: {galat}
          </Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        {KARTU.map((k) => {
          const nilai = angka ? angka[k.kunci] : null;
          return (
            <Grid key={k.kunci} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                sx={{
                  p: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  borderRadius: 3,
                  border: "1px solid #EEF0F4",
                  boxShadow: "0 1px 2px rgba(16,24,40,0.06)",
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    flexShrink: 0,
                    borderRadius: 2,
                    bgcolor: k.bg,
                    color: k.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {k.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  {memuat ? (
                    <Skeleton width={64} height={40} />
                  ) : nilai === null ? (
                    <Typography variant="h6" fontWeight={700} sx={{ color: "#6B7280" }}>
                      Tidak tersedia
                    </Typography>
                  ) : (
                    <Typography variant="h4" fontWeight={700}>
                      {nilai}
                    </Typography>
                  )}
                  <Typography color="text.secondary" fontSize={14}>
                    {k.label}
                  </Typography>
                  {!memuat && catatan[k.kunci] && (
                    <Typography fontSize={12} sx={{ color: "#9CA3AF", mt: 0.5 }}>
                      {catatan[k.kunci]}
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
