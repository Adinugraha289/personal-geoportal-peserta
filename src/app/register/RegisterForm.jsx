"use client";

import React, { useState } from 'react';
import {
    Alert,
    Button,
    CircularProgress,
    IconButton,
    InputAdornment,
    Link,
    Paper,
    TextField,
    Typography
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { palette } from "../../theme/theme";

const RegisterForm = () => {
    const router = useRouter();

    // State Input
    const [nama, setNama] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // State UI & Feedback
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // 1. Validasi Input Kosong
        if (!nama || !email || !password || !confirmPassword) {
            setError("Semua field wajib diisi!");
            return;
        }

        // 2. Validasi Panjang Password
        if (password.length < 6) {
            setError("Password minimal terdiri dari 6 karakter!");
            return;
        }

        // 3. Validasi Kesesuaian Password
        if (password !== confirmPassword) {
            setError("Konfirmasi password tidak cocok!");
            return;
        }

        setLoading(true);

        try {
            // Contoh pemanggilan API backend untuk registrasi
            const res = await fetch("/portal/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nama, email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Gagal mendaftar. Silakan coba lagi.");
            }

            // Setelah berhasil register, arahkan ke halaman login
            router.push("/login");
        } catch (err) {
            setError(err.message || "Terjadi kesalahan pada server.");
            setLoading(false);
        }
    };

    const handleLoginRedirect = () => {
        router.push("/login");
    };

    return (
        <Paper
            elevation={0}
            component="form"
            onSubmit={handleSubmit}
            sx={{
                width: "100%",
                maxWidth: 400,
                p: 4,
                backgroundColor: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: 2,
            }}
        >
            <Typography
                variant="h5"
                sx={{ color: palette.text, fontWeight: 600, mb: 0.5 }}
            >
                Daftar Akun
            </Typography>

            <Typography
                variant="body2"
                sx={{
                    color: palette.muted,
                    mb: 2,
                }}
            >
                Lengkapi data di bawah ini untuk membuat akun baru
            </Typography>

            {/* Alert Error */}
            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 2,
                        backgroundColor: "rgba(201, 162, 39, 0.08)",
                        color: palette.brass,
                        border: `1px solid ${palette.brassDim}`,
                        "& .MuiAlert-icon": {
                            color: palette.brass,
                        },
                    }}
                >
                    {error}
                </Alert>
            )}

            {/* Field Nama */}
            <TextField
                fullWidth
                label="Nama Lengkap"
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                margin="normal"
                autoComplete="name"
                disabled={loading}
            />

            {/* Field Email */}
            <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                autoComplete="email"
                disabled={loading}
            />

            {/* Field Password */}
            <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                disabled={loading}
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    edge="end"
                                    size="small"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
            />

            {/* Field Konfirmasi Password */}
            <TextField
                fullWidth
                label="Konfirmasi Password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                disabled={loading}
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    edge="end"
                                    size="small"
                                >
                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
            />

            {/* Redirect ke Login */}
            <Link
                component="button"
                type="button"
                variant="body2"
                underline="hover"
                onClick={handleLoginRedirect}
                sx={{
                    color: palette.muted,
                    display: "block",
                    mt: 1,
                    textAlign: "left",
                    cursor: "pointer",
                    "&:hover": {
                        color: palette.text,
                    },
                }}
            >
                Sudah memiliki akun? Login.
            </Link>

            {/* Tombol Submit */}
            <Button
                type="submit"
                fullWidth
                disabled={loading}
                sx={{
                    mt: 2,
                    py: 1.2,
                    backgroundColor: palette.moss,
                    color: palette.text,
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": {
                        backgroundColor: palette.mossDim,
                    },
                    "&.Mui-disabled": {
                        backgroundColor: palette.mossDim,
                        color: palette.muted,
                    },
                }}
            >
                {loading ? (
                    <CircularProgress size={22} sx={{ color: palette.text }} />
                ) : (
                    "Register"
                )}
            </Button>
        </Paper>
    );
};

export default RegisterForm;