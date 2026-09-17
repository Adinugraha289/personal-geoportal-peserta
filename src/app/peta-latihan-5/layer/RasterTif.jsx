import parseGeoraster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";

export default function addRasterTif(urlTiff) { 

    return fetch(urlTiff) 

        .then(function (response) {
            if (!response.ok) {
                throw new Error("File TIFF tidak ditemukan: " + urlTiff);
            }
            return response.arrayBuffer();
        })

        .then(function (arrayBuffer) {
            return parseGeoraster(arrayBuffer);
        })

        .then(function (georaster) {
            const rasterLayer = new GeoRasterLayer({
                georaster: georaster,
                opacity: 0.7,
                resolution: 256
            });

            return rasterLayer;   
        })

        .catch(function (error) {
            console.log("Gagal memuat file TIFF:", error);
            return null;   
        });
        
}