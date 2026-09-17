"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Paper, InputBase, IconButton, Fade } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

export default function Search({ L, map, markerRef }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  const runSearch = useCallback(async (text) => {
    if (!text || text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=id&q=${encodeURIComponent(
          text
        )}`,
        { headers: { Accept: "application/json" } }
      );
      const data = await res.json();
      setSuggestions(data || []);
    } catch (e) {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 450);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const handleSelectResult = useCallback(
    (result) => {
      if (!L || !map) return;
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      map.flyTo([lat, lon], 17, { duration: 1 });
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
      markerRef.current = L.marker([lat, lon]).addTo(map);
      setQuery(result.display_name);
      setSuggestions([]);
    },
    [L, map, markerRef]
  );

  const handleClearSearch = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    if (markerRef.current && map) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  }, [map, markerRef]);

  return (
    <Box sx={{ width: { xs: 280, sm: 220, md: 320 }, zIndex: 1000 }}>
      <Paper
        elevation={3}
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1.5,
          py: 0.5,
          borderRadius: 2,
          bgcolor: "#F7F3E7",
        }}
      >
        <SearchIcon sx={{ color: "#0F2A24", opacity: 0.6, mr: 1 }} fontSize="small" />
        <InputBase
          placeholder="Cari alamat atau lokasi..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: 1, fontSize: 13, color: "#16241F" }}
        />
        {query && (
          <IconButton size="small" onClick={handleClearSearch}>
            <CloseIcon fontSize="small" sx={{ color: "#4A5750" }} />
          </IconButton>
        )}
      </Paper>

      <Fade in={suggestions.length > 0}>
        <Paper
          elevation={4}
          sx={{
            mt: 0.5,
            borderRadius: 2,
            bgcolor: "#F7F3E7",
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          {suggestions.map((r, idx) => (
            <Box
              key={idx}
              onClick={() => handleSelectResult(r)}
              sx={{
                px: 2,
                py: 1.2,
                fontSize: 13,
                color: "#16241F",
                cursor: "pointer",
                borderBottom: idx !== suggestions.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                "&:hover": { bgcolor: "rgba(42,157,143,0.08)" },
              }}
            >
              {r.display_name}
            </Box>
          ))}
        </Paper>
      </Fade>

      {searching && (
        <Box sx={{ mt: 0.5, fontSize: 11, color: "#16241F", opacity: 0.7 }}>
          Mencari...
        </Box>
      )}
    </Box>
  );
}