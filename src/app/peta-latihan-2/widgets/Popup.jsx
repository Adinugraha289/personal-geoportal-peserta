import L from 'leaflet';

const markerIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

export function addPopup(map){

    const marker = L.marker([-6.1753649,106.8270038], {
        icon: markerIcon
    }).addTo(map);

    marker.bindPopup(
        `<b>Monas</b>
        <br/> Lokasi: Jakarta Pusat<br/>
        Kategori: Landmark` 
     );
     
return marker;

}