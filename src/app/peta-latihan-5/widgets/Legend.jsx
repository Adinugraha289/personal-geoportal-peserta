import L from "leaflet";


export function addLegend(map) {

    const legend = L.control({
        position: "bottomright"
    });

    legend.onAdd = function () {
    const div = document.createElement("div");

        div.style.background = "white";
        div.style.padding = "10px";
        div.style.color = "black";

        div.innerHTML = 
            `  <b>Legenda</b><br/>
            <span style="color:red">●</span> Landmark<br/>
            <span style="color:blue">●</span> Fasilitas Umum`;

    return div;

    };

legend.addTo(map);

}