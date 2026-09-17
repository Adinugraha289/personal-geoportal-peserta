'use client';

import React, { useState, useRef, useCallback } from 'react';
import { createSession } from '../../../lib/splat/session';

// Material UI Components (MUI v5)
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    LinearProgress,
    Alert,
    Paper,
    Grid,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MemoryIcon from '@mui/icons-material/Memory';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';

const MAX_ITERS = 20000;

const STAGE_LABELS = {
    decode: 'Membaca foto...',
    match: 'Mencari & mencocokkan fitur (SIFT)...',
    solve: 'Menyelesaikan posisi kamera (SfM)...',
    seed: 'Menabur Gaussian awal dari point cloud...',
    train: 'Melatih Gaussian Splatting...',
};

function stageLabel(e) {
    const base = STAGE_LABELS[e?.stage] || 'Memproses...';

    if (typeof e?.detail === 'string' && e.detail.length > 0) {
        return `${base} ${e.detail}`;
    }
    if (typeof e?.detail === 'object' && e.detail !== null) {
        const { n } = e.detail;
        if (n !== undefined) return `${base} (Mencocokkan ${n} fitur...)`;
    }
    if (typeof e?.total === 'number' && e.total > 0) {
        return `${base} (${e?.done ?? 0}/${e.total})`;
    }
    return base;
}

export default function BuatData() {
    const [status, setStatus] = useState('Siap menerima dataset (disarankan 20-200 foto).');
    const [progress, setProgress] = useState(0);
    const [isTraining, setIsTraining] = useState(false);
    const [error, setError] = useState('');
    const [metrics, setMetrics] = useState(null);
    const [fileCount, setFileCount] = useState(0);
    const [stageDetail, setStageDetail] = useState(null);

    const canvasRef = useRef(null);
    const sessionRef = useRef(null);
    const lastIterRef = useRef(0);

    // Fallback checker untuk mendeteksi kapan training selesai
    const waitForTrainingDone = useCallback(() => {
        return new Promise((resolve) => {
            let lastCheckIter = -1;
            let unchangedTicks = 0;

            const timer = setInterval(() => {
                // Jika sudah mencapai iterasi maksimum
                if (lastIterRef.current >= MAX_ITERS - 1) {
                    clearInterval(timer);
                    resolve();
                    return;
                }

                // Cek jika iterasi tidak bertambah
                if (lastIterRef.current === lastCheckIter && lastIterRef.current > 0) {
                    unchangedTicks += 1;
                } else {
                    unchangedTicks = 0;
                    lastCheckIter = lastIterRef.current;
                }

                // Hanya stop jika benar-benar macet selama ~60 detik
                if (unchangedTicks > 200) {
                    clearInterval(timer);
                    resolve();
                }
            }, 300);
        });
    }, []);

    const handleStartTraining = useCallback(async (files) => {
        if (!files || files.length < 2) {
            setError('Minimal butuh 2 foto yang saling overlap untuk bisa di-solve.');
            return;
        }

        setIsTraining(true);
        setError('');
        setProgress(0);
        setMetrics(null);
        setStageDetail(null);
        setFileCount(files.length);
        lastIterRef.current = 0;

        try {
            // Sesuai konfigurasi standar Arrival Space:
            // splatBudget dinaikkan ke 2.500.000 agar detail tidak dipotong (menghasilkan file ~150MB+)
            const session = createSession({
                maxIters: MAX_ITERS,
                splatBudget: 2500000,
                shDegree: 3,
            });
            sessionRef.current = session;

            if (typeof session.on === 'function') {
                session.on('stage', (e) => {
                    setStatus(String(stageLabel(e)));
                    setStageDetail(typeof e?.detail === 'object' && e.detail !== null ? e.detail : null);
                    if (e?.total) {
                        setProgress(Math.round(((e.done || 0) / e.total) * 100));
                    }
                });

                session.on('metrics', (e) => {
                    setMetrics(e);
                    if (typeof e?.iter === 'number') {
                        lastIterRef.current = e.iter;
                        setProgress(Math.min(100, Math.round((e.iter / MAX_ITERS) * 100)));
                    }
                });
            }

            setStatus(`Memuat ${files.length} foto ke dalam session...`);
            await session.load(files);

            setStatus('Mencari fitur & menyelesaikan posisi kamera (SfM)...');
            await session.solve();

            setStatus('Menabur Gaussian awal...');
            await session.seed();

            // 1. ANCHOR CANVAS DULUAN SEBELUM START TRAINING
            if (canvasRef.current && session.view?.attach) {
                session.view.attach(canvasRef.current);
            }

            setStatus(`Melatih Gaussian Splatting (${MAX_ITERS.toLocaleString()} cycles)...`);

            // 2. JALANKAN session.start() TANPA await AGAR NON-BLOCKING & LIVE PREVIEW CANVAS AKTIF
            session.start();

            // 3. TUNGGU HINGGA PROSES TRAINING DILUAR WORKER SELESAI
            await waitForTrainingDone();

            setStatus('Training selesai! Menyiapkan file .PLY...');
            const plyBlob = await session.exportPlyBlob();
            const url = URL.createObjectURL(plyBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'gedung-3d.ply';
            a.click();

            setStatus('File gedung-3d.ply berhasil diunduh!');
            setProgress(100);
        } catch (err) {
            console.error('Error saat training:', err);
            setError(err?.message || String(err));
            setStatus('Terjadi kesalahan saat training.');
        } finally {
            setIsTraining(false);
        }
    }, [waitForTrainingDone]);

    return (
        <Card
            sx={{
                maxWidth: 900,
                mx: 'auto',
                bgcolor: '#090d16',
                color: '#f8fafc',
                borderRadius: 4,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(10px)'
            }}
        >
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                {/* Header Toolbar */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex' }}>
                            <MemoryIcon />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.02em', fontSize: '1.15rem' }}>
                                3D Gaussian Splatting Studio
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                Browser-based Spatial Reconstruction
                            </Typography>
                        </Box>
                    </Box>

                    <Chip
                        label={isTraining ? 'Training Running' : 'Idle'}
                        size="small"
                        color={isTraining ? 'primary' : 'default'}
                        sx={{
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            bgcolor: isTraining ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: isTraining ? '#60a5fa' : '#94a3b8',
                            border: `1px solid ${isTraining ? 'rgba(96, 165, 250, 0.3)' : 'rgba(255,255,255,0.1)'}`
                        }}
                    />
                </Box>

                {/* Action Button */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Button
                        component="label"
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        disabled={isTraining}
                        sx={{
                            bgcolor: '#2563eb',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            py: 1,
                            borderRadius: 2.5,
                            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                            '&:hover': { bgcolor: '#1d4ed8' }
                        }}
                    >
                        Pilih Foto Dataset
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                                const files = e.target.files ? Array.from(e.target.files) : [];
                                if (files.length > 0) handleStartTraining(files);
                                e.target.value = '';
                            }}
                        />
                    </Button>

                    {fileCount > 0 && (
                        <Typography variant="caption" sx={{ color: '#94a3af', fontFamily: 'monospace' }}>
                            Dataset: <strong>{fileCount}</strong> foto dipilih
                        </Typography>
                    )}
                </Box>

                {/* Viewport Canvas 3D */}
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        bgcolor: '#030712',
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 0)',
                        backgroundSize: '24px 24px'
                    }}
                >
                    <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

                    <Box
                        sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            display: 'flex',
                            gap: 1,
                            bgcolor: 'rgba(15, 23, 42, 0.65)',
                            backdropFilter: 'blur(8px)',
                            p: 0.5,
                            borderRadius: 2,
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                    >
                        <Tooltip title="Live Preview Engine">
                            <IconButton size="small" sx={{ color: '#94a3b8' }}>
                                <CenterFocusWeakIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Progress Log */}
                <Box sx={{ bgcolor: 'rgba(15, 23, 42, 0.5)', p: 2, borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 500 }}>
                            {status}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#3b82f6', fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {progress}%
                        </Typography>
                    </Box>

                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.08)',
                            '& .MuiLinearProgress-bar': {
                                bgcolor: '#3b82f6',
                                borderRadius: 3,
                            },
                        }}
                    />

                    {stageDetail && (
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 1, fontFamily: 'monospace' }}>
                            {Object.entries(stageDetail)
                                .map(([key, val]) => `${key}=${val}`)
                                .join(' · ')}
                        </Typography>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mt: 1.5, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            Error: {error}
                        </Alert>
                    )}
                </Box>

                {/* Metrics Bar */}
                {metrics && (
                    <Grid container spacing={1.5}>
                        <Grid xs={6} sm={3}>
                            <Stat label="Iterasi" value={metrics.iter?.toLocaleString?.() ?? '-'} />
                        </Grid>
                        <Grid xs={6} sm={3}>
                            <Stat label="Active Splats" value={metrics.splats?.toLocaleString?.() ?? '-'} />
                        </Grid>
                        <Grid xs={6} sm={3}>
                            <Stat label="Speed" value={metrics.itersPerSec != null ? `${Math.round(metrics.itersPerSec)} cycle/s` : '-'} />
                        </Grid>
                        <Grid xs={6} sm={3}>
                            <Stat label="PSNR" value={metrics.psnrTrain != null ? `${metrics.psnrTrain.toFixed(1)} dB` : '-'} />
                        </Grid>
                    </Grid>
                )}

            </CardContent>
        </Card>
    );
}

function Stat({ label, value }) {
    return (
        <Paper
            elevation={0}
            sx={{
                bgcolor: 'rgba(15, 23, 42, 0.6)',
                p: 1.5,
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: '#ffffff'
            }}
        >
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                {label}
            </Typography>
            <Typography variant="body1" fontWeight="bold" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                {value}
            </Typography>
        </Paper>
    );
}