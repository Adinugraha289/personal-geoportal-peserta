"use client";

import React, { useEffect, useRef } from 'react'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import addLayerBasemap from '../widgets/BaseMap';
import { addPopup } from '../widgets/Popup';
import { addLegend } from '../widgets/Legend';
import { addGeojson } from '../layer/Geojson';
import { addKML } from '../layer/Kml';
import { addWMS } from '../layer/Wms';

export default function Map() {
    const mapRef = useRef(null);

    useEffect(() => {
        const map = L.map(mapRef.current).setView([-6.1753649, 106.8270038], 15);

        const geojsonLayer = addGeojson(map);
        geojsonLayer.addTo(map); 
        const overlayMaps = {
            "Landmark & Pemerintahan": geojsonLayer
        };

        const layerControl = addLayerBasemap(map, overlayMaps);

        addPopup(map);
        addLegend(map);


        addKML("/data/latihan.kml").then(function (kmlLayer) {
            if (kmlLayer) {
                layerControl.addOverlay(kmlLayer, "KML Latihan");
            }
        });

        const wmsLayer = addWMS(map);
        layerControl.addOverlay(wmsLayer, "WMS Permukiman Kumuh DKI");


        return () => {
            map.remove();
        }
    }, []);

    return (
        <div style={{ width: "100%", height: "100%" }} ref={mapRef}></div>
    )
}