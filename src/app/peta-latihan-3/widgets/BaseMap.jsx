import L from 'leaflet';

export default function addLayerBasemap(map, overlayMaps = {}) { 

    const osm = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { 
            attribution: "OpenStreetMap" 
        }
    );

    const satelit = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { 
            attribution: "Esri"
         }
    );

    osm.addTo(map);

    const baseMaps = {
        "Peta Jalan (OSM)": osm,
        "Citra Satelit": satelit
    };

    const layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

    return layerControl;  
}