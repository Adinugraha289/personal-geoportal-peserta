"use client";

import React, { useEffect, useRef } from 'react'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import addLayerBasemap from '../widgets/BaseMap';
import { addPopup } from '../widgets/Popup';
import { addLegend } from '../widgets/Legend';

export default function Map() {
    const mapRef = useRef(null);

    useEffect(() => {
        const map = L.map(mapRef.current).setView([-6.1753649, 106.8270038], 15);

        const overlayMaps = {};

        const layerControl = addLayerBasemap(map, overlayMaps);

        addPopup(map);
        addLegend(map);

        return () => {
            map.remove();
        }
    }, []);

    return (
        <div style={{ width: "100%", height: "100%" }} ref={mapRef}></div>
    )
}