"use client";

import React, { useState, useEffect, useRef } from "react";
import { MyLocation, MyLocationOutlined } from "@mui/icons-material";
import { Paper, IconButton, Tooltip } from "@mui/material";

const MONAS_COORDS = { latitude: -6.1754, longitude: 106.8272 };

const locationIconSVG = `
<svg width="256px" height="256px" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 0C3.99844 0 0 3.99844 0 9C0 10.7297 0.515625 12.0656 1.41094 13.4203L8.05313 23.4984C8.25469 23.8031 8.60156 24 9 24C9.39844 24 9.75 23.7984 9.94688 23.4984L16.5891 13.4203C17.4844 12.0656 18 10.7297 18 9C18 3.99844 14.0016 0 9 0ZM9 13.9969C6.23906 13.9969 3.99844 11.7563 3.99844 8.99063C3.99844 6.225 6.23906 3.98438 9 3.98438C11.7609 3.98438 14.0016 6.225 14.0016 8.99063C14.0016 11.7563 11.7609 13.9969 9 13.9969Z" fill="#003577"/>
    <circle cx="9" cy="9" r="5" fill="#F7941D"/>
</svg>
`;

const locationIconUrl =
  "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(locationIconSVG);

const Locate = ({ L, map, userMarkerRef, buttonSize = 40, tooltip = "left" }) => {
  const [isWidgetActive, setIsWidgetActive] = useState(true);
  const permissionRequestedRef = useRef(false);

  const createLocationIcon = () =>
    L.icon({
      iconUrl: locationIconUrl,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });

  const placeMarker = (coords) => {
    if (!L || !map) return;

    if (userMarkerRef.current) {
      try {
        map.removeLayer(userMarkerRef.current);
      } catch (err) {
        console.error("Error removing previous user marker:", err);
      }
      userMarkerRef.current = null;
    }

    const marker = L.marker([coords.latitude, coords.longitude], {
      icon: createLocationIcon(),
      zIndexOffset: 1000,
    })
      .addTo(map)
      .bindPopup("Lokasi Anda");

    userMarkerRef.current = marker;

    map.flyTo([coords.latitude, coords.longitude], 16, { duration: 1 });
  };

  const fallbackToMonas = () => {
    placeMarker(MONAS_COORDS);
  };

  const getUserLocation = () => {
    if (!("geolocation" in navigator)) {
      console.warn("Geolocation tidak didukung oleh browser ini");
      fallbackToMonas();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (!latitude || !longitude) {
          console.error("Koordinat tidak valid, fallback ke Monas.");
          fallbackToMonas();
          return;
        }
        placeMarker({ latitude, longitude });
      },
      (error) => {
        console.error("Error getting user location:", error);
        fallbackToMonas();
      },
      { timeout: 10000, maximumAge: 0 }
    );
  };

  const requestLocationPermission = async () => {
    if (!L || !map) {
      console.warn("Map tidak tersedia, tidak dapat menampilkan lokasi");
      return;
    }

    if (!("permissions" in navigator)) {
      getUserLocation();
      return;
    }

    try {
      const permissionStatus = await navigator.permissions.query({
        name: "geolocation",
      });

      if (
        permissionStatus.state === "granted" ||
        permissionStatus.state === "prompt"
      ) {
        getUserLocation();
      } else {
        console.warn("Akses lokasi tidak diaktifkan, fallback ke Monas.");
        fallbackToMonas();
      }
    } catch (err) {
      console.error("Error requesting geolocation permission:", err);
      fallbackToMonas();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!L || !map) return;
    if (permissionRequestedRef.current) return;

    permissionRequestedRef.current = true;

    const initTimer = setTimeout(() => {
      requestLocationPermission();
    }, 1500);

    return () => {
      clearTimeout(initTimer);
    };
  }, [L, map]);

  const handleButtonAdd = () => {
    setIsWidgetActive(true);
    setTimeout(() => {
      requestLocationPermission();
    }, 800);
  };

  const handleButtonRemoved = () => {
    if (userMarkerRef.current && map) {
      try {
        map.removeLayer(userMarkerRef.current);
      } catch (err) {
        console.error("Error removing user marker:", err);
      }
      userMarkerRef.current = null;
    }
    setIsWidgetActive(false);
  };

  return isWidgetActive ? (
    <Tooltip title="Matikan Lokasi" placement={tooltip}>
      <Paper
        elevation={3}
        component={IconButton}
        onClick={handleButtonRemoved}
        sx={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: 1.5,
          bgcolor: "#0F2A24",
          color: "#F4EFE2",
          "&:hover": { bgcolor: "#16332B" },
        }}
      >
        <MyLocationOutlined fontSize="small" />
      </Paper>
    </Tooltip>
  ) : (
    <Tooltip title="Aktifkan Lokasi" placement={tooltip}>
      <Paper
        elevation={3}
        component={IconButton}
        onClick={handleButtonAdd}
        sx={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: 1.5,
          bgcolor: "#0F2A24",
          color: "#F4EFE2",
          "&:hover": { bgcolor: "#16332B" },
        }}
      >
        <MyLocation fontSize="small" />
      </Paper>
    </Tooltip>
  );
};

export default Locate;