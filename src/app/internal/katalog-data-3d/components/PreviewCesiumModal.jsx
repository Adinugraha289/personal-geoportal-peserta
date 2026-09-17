"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useSession } from "next-auth/react";

const CESIUM_VERSION = "1.120";
const CESIUM_BASE_URL = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/`;
const CESIUM_SCRIPT_URL = `${CESIUM_BASE_URL}Cesium.js`;
const CESIUM_STYLE_URL = `${CESIUM_BASE_URL}Widgets/widgets.css`;

function loadCesiumCDN(onSuccess, onError) {
    if (window.Cesium) {
        onSuccess();
        return;
    }

    if (!document.querySelector(`link[href="${CESIUM_STYLE_URL}"]`)) {
        const cssTag = document.createElement("link");
        cssTag.rel = "stylesheet";
        cssTag.href = CESIUM_STYLE_URL;
        document.head.appendChild(cssTag);
    }

    if (!document.querySelector(`script[src="${CESIUM_SCRIPT_URL}"]`)) {
        const scriptTag = document.createElement("script");
        scriptTag.src = CESIUM_SCRIPT_URL;
        scriptTag.async = true;
        scriptTag.onload = onSuccess;
        scriptTag.onerror = () => onError("Gagal memuat CesiumJS dari CDN.");
        document.body.appendChild(scriptTag);
    } else {
        const existingScript = document.querySelector(`script[src="${CESIUM_SCRIPT_URL}"]`);
        existingScript.addEventListener("load", onSuccess);
        existingScript.addEventListener("error", () => onError("Gagal memuat CesiumJS dari CDN."));
    }
}

export default function PreviewCesiumModal({ openPreview, item }) {
    const containerRef = useRef(null);
    const viewerRef = useRef(null);
    const [status, setStatus] = useState("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const session = useSession();

    useEffect(() => {
        if (!openPreview) return;

        setStatus("memuat");
        loadCesiumCDN(
            () => setStatus("siap"),
            (errMsg) => {
                setErrorMessage(errMsg);
                setStatus("error");
            }
        );
    }, [openPreview]);

    useEffect(() => {
        if (!openPreview || status !== "siap" || !containerRef.current || viewerRef.current || !item) return;

        const Cesium = window.Cesium;
        Cesium.buildModuleUrl.setBaseUrl(CESIUM_BASE_URL);

        // 1. Matikan Cesium Ion secara eksplisit agar tidak melempar HTTP 401
        Cesium.Ion.defaultAccessToken = "";

        const lat = Number(item.latitude);
        const lon = Number(item.longitude);

        if (!item.url || !Number.isFinite(lat) || !Number.isFinite(lon)) {
            setErrorMessage("URL file GLB atau koordinat tidak valid.");
            setStatus("error");
            return;
        }

        try {
            // 2. Inisialisasi Viewer tanpa menggunakan layer bawaan Cesium Ion
            const viewer = new Cesium.Viewer(containerRef.current, {
                baseLayer: false, // Matikan Bing Maps / Cesium Ion default layer
                terrainProvider: new Cesium.EllipsoidTerrainProvider(), // Pakai Ellipsoid sederhana tanpa Cesium Ion Terrain
                timeline: false,
                animation: false,
                baseLayerPicker: false,
                geocoder: false,
                homeButton: true,
                navigationHelpButton: false,
                sceneModePicker: false,
                infoBox: false,
                selectionIndicator: false,
            });

            viewerRef.current = viewer;

            // 3. Tambahkan Basemap OpenStreetMap lokal/eksternal yang tidak butuh token
            viewer.imageryLayers.addImageryProvider(
                new Cesium.UrlTemplateImageryProvider({
                    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    subdomains: ["a", "b", "c"],
                    credit: "© OpenStreetMap contributors",
                })
            );

            // 4. Tambahkan Model 3D
            const position = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
            const modelEntity = viewer.entities.add({
                position,
                model: {
                    uri: `${item.url}?access_token=${session?.data?.accessToken}`,
                    scale: 100.0,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                },
            });

            viewer.zoomTo(modelEntity).catch((err) => {
                console.error("Gagal Zoom:", err?.message || err);
            });

        } catch (err) {
            console.error("Cesium Viewer Error:", err);
            setErrorMessage("Gagal menginisialisasi peta 3D.");
            setStatus("error");
        }

        return () => {
            if (viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, [openPreview, status, item]);

    if (!openPreview) return null;

    return (
        <Box
            sx={{
                width: "100%",
                height: "500px",
                bgcolor: "#1E1E2D",
                borderRadius: 2,
                overflow: "hidden",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {status === "memuat" && <Typography sx={{ color: "#fff" }}>Memuat Peta 3D...</Typography>}

            {status === "error" && (
                <Typography sx={{ color: "#ef4444", p: 2, textAlign: "center" }}>
                    {errorMessage || "Terjadi kesalahan saat memuat 3D."}
                </Typography>
            )}

            <Box
                ref={containerRef}
                sx={{
                    width: "100%",
                    height: "100%",
                    visibility: status === "siap" ? "visible" : "hidden",
                }}
            />
        </Box>
    );
}