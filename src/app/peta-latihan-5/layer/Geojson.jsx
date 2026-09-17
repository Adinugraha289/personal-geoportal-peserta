import L from "leaflet";

const markerIcon = new L.Icon({
    iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});


function getPolygonStyle(feature) {

    const kategori = feature.properties.kategori;

    if (kategori === "Landmark") {
        return {
            color: "red",
            weight: 3,
            fillColor: "orange",
            fillOpacity: 0.5
        };
    }

    if (kategori === "Pemerintahan") {
        return {
            color: "blue",
            weight: 3,
            fillColor: "lightblue",
            fillOpacity: 0.5
        };
    }

    return {
        color: "gray",
        weight: 2,
        fillColor: "lightgray",
        fillOpacity: 0.5
    };
}

export function addGeojson(map) {

    const dataGeojson = {
        type: "FeatureCollection",
        features: [
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
        style: function (feature) {
            return getPolygonStyle(feature);
        },

        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: markerIcon});
        },

        onEachFeature: function (feature, layer) {
            const nama = feature.properties.nama;
            const kategori = feature.properties.kategori;
            layer.bindPopup(`
                <div class="popup-content">
                    <h3>${nama}</h3>
                    <p>
                        <strong>Kategori:</strong>
                        ${kategori}
                    </p>
                </div>
            `);
        }
    });

    return geojsonLayer;
}