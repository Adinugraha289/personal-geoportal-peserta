"use client";

import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";

import Home from "../peta/widgets/Home";
import Locate from "../peta/widgets/Locate";
import Basemap from "../peta/widgets/Basemap";
import Search from "../peta/widgets/Search";
import FullScreen from "../peta/widgets/FullScreen";
import Bahasa from "../peta/widgets/Bahasa";
import Zoom from "../peta/widgets/Zoom";

const HOME_COORDS = { lat: -6.1754, lng: 106.8272, zoom: 16 };

const BASEMAPS = {
  satelit: {
    label: "Citra Satelit",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  jalan: {
    label: "Peta Jalan (OSM)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
};

const DEFAULT_BASEMAP = "jalan";
const BUTTON_SIZE = 40;

export default function MapComponent() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerRef = useRef(null);
  const userMarkerRef = useRef(null);

  const [activeBasemap, setActiveBasemap] = useState(DEFAULT_BASEMAP);
  const [bahasa, setBahasa] = useState("ID");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || mapRef.current) return;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [HOME_COORDS.lat, HOME_COORDS.lng],
        zoom: HOME_COORDS.zoom,
        zoomControl: false, 
      });

      L.control.scale({ position: "bottomleft", imperial: false }).addTo(map);

      const basemap = BASEMAPS[DEFAULT_BASEMAP];
      tileLayerRef.current = L.tileLayer(basemap.url, {
        attribution: basemap.attribution,
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const L = ready ? leafletRef.current : null;
  const map = ready ? mapRef.current : null;

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100dvh" }}>
      <Box ref={mapContainerRef} sx={{ width: "100%", height: "100%" }} />

      <Box
        sx={{
          position: "absolute",
          top: { xs: 84, md: 96 },
          right: 16,
          zIndex: 1000,
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 0.75,
        }}
      >
        <Box sx={{ display: "flex", gap: 5,  padding: 1, }}>
          <Home map={map} markerRef={markerRef} />
          <Locate L={L} map={map} userMarkerRef={userMarkerRef} buttonSize={BUTTON_SIZE} tooltip="left" />
          <FullScreen buttonSize={BUTTON_SIZE} tooltip="bottom" />
          <Bahasa
            buttonSize={BUTTON_SIZE}
            tooltip="bottom"
            bahasa={bahasa}
            setBahasa={setBahasa}
          />
        </Box>

        <Box sx={{ width: "100%" }}>
          <Search L={L} map={map} markerRef={markerRef} />
        </Box>
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: 90,
          right: 16,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Basemap
          L={L}
          map={map}
          tileLayerRef={tileLayerRef}
          activeBasemap={activeBasemap}
          onChangeBasemap={setActiveBasemap}
        />
        <Zoom map={map} buttonSize={BUTTON_SIZE} />
        
      </Box>
    </Box>
  );
}