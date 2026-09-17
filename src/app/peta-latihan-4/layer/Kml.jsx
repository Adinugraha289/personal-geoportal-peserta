import L from "leaflet";
import "leaflet-kml";

export function addKML(urlKML) {  

    return fetch(urlKML)   

        .then(function (response) {
            if (!response.ok) {
                throw new Error("File KML tidak ditemukan: " + urlKML);
            }
            return response.text();
        })

        .then(function (kmlText) {

            const parser = new DOMParser();
            const kmlDocument = parser.parseFromString(kmlText, "text/xml");
            const kmlLayer = new L.KML(kmlDocument);


            return kmlLayer;   
        })

        .catch(function (error) {
            console.log("Gagal memuat file KML:", error);
            return null;   
        });
}