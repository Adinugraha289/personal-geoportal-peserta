"use client";

import { Alert, Button, CircularProgress, IconButton, InputAdornment, Link, Paper, TextField, Typography } from '@mui/material'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { palette } from "../../theme/theme"
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { signIn } from 'next-auth/react';

const LoginForm = ({ session }) => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (session) {
            router.push("/internal")
        }
    }, [session]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Email dan password wajib diisi!");
            return;
        }

        setLoading(true);

        const result = await signIn("geoportal-credential", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError(result.error);
            setLoading(false);
            return;
        }

        // arahkan ke folder route internal yang benar: /web-internal
        router.push("/internal");
    };

    const handleRegisterRedirect = () => {
        router.push("/register");
    }

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
                Masuk
            </Typography>
            <Typography
                variant="body2"
                sx={{
                    color: palette.muted,
                }}
            >
                Silahkan login untuk melanjutkan
            </Typography>

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

            <Link
                component="button"
                type="button"
                variant="body2"
                underline="hover"
                onClick={handleRegisterRedirect}
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
                Belum memiliki akun? Register.
            </Link>

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
                    "Login"
                )}
            </Button>
        </Paper>
    )
}

export default LoginForm