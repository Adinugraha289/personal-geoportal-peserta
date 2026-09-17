import L from "leaflet";

const markerIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

export function addGeojson(map) {

    const dataGeojson = {
        "type": "FeatureCollection",
        "features": [
            {
                type: "Feature",
                properties: {
                    nama: "Balai Kota Jakarta",
                    kategori: "Pemerintahan"
                },
                geometry: {
                    type: "Point",
                    coordinates: [106.8296, -6.1744]
                }
            },
            {
                type: "Feature",
                properties: {
                    nama: "Monumen Nasional (Monas)",
                    kategori: "Landmark"
                },
                geometry: {
                    type: "Polygon",
                    coordinates: [
                        [
                            [106.8280349543877, -6.1782473695484015],
                            [106.8280349543877, -6.1800265441739555],
                            [106.82479246320429, -6.1800265441739555],
                            [106.82479246320429, -6.1782473695484015],
                            [106.8280349543877, -6.1782473695484015]
                        ]
                    ]
                }
            }
        ]
    };

    const geojsonLayer = L.geoJSON(dataGeojson, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, { icon: markerIcon });
        },

        onEachFeature: function (feature, layer) {
            layer.bindPopup(`
                <b>${feature.properties.nama}</b><br/>
                Kategori: ${feature.properties.kategori}
            `);
        }
    }); 

    return geojsonLayer;
}