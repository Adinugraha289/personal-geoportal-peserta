"use client";

import React, { useEffect, useRef } from 'react'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Map() {
    const mapRef = useRef(null);

    useEffect(() => {
        const map = L.map(mapRef.current).setView([-6.2088, 106.8456], 13);

        const basemap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");

        map.addLayer(basemap);

        return () => {
            map.remove();
        }
    }, []);

    return (
        <div style={{ width: "100%", height: "100%" }} ref={mapRef}></div>
    )
}
