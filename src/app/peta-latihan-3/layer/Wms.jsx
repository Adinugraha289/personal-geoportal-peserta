import L from "leaflet";

export function addWMS() {

    const wmsLayer = L.tileLayer.wms(
        "https://geoserver.bps.go.id/rw-kumuh-dki/wms",
        {
            layers: "rw-kumuh-dki:peta_kabupaten-kota",
            format: "image/png",
            transparent: true,
            attribution: "GeoServer WMS - BPS"
        }
    );


    return wmsLayer;
}