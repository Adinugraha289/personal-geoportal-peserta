
export default function addLayerBasemap(viewer) {
  const Cesium = window.Cesium;

  const baseMaps = {
    'Peta Jalan (OSM)': new Cesium.UrlTemplateImageryProvider({
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      // OpenStreetMap berhenti di level 19. Tanpa batas ini, Cesium meminta
      // level 20 ke atas saat kamera mendekat, dan OSM menjawab HTTP 400.
      // Balasan 400 tidak memuat header CORS, sehingga browser melaporkannya
      // sebagai galat CORS, bukan sebagai galat 400.
      maximumLevel: 19,
credit: '© OpenStreetMap contributors',
    }),
    'Citra Satelit': new Cesium.UrlTemplateImageryProvider({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      credit: '© Esri',
    }),
  };

  const namaAwal = Object.keys(baseMaps)[0];
  let activeLayer = viewer.imageryLayers.addImageryProvider(baseMaps[namaAwal]);

  function switchBasemap(nama) {
    if (!baseMaps[nama]) return;
    viewer.imageryLayers.remove(activeLayer, true);
    activeLayer = viewer.imageryLayers.addImageryProvider(baseMaps[nama]);
  }

  const panel = document.createElement('select');
  panel.style.cssText =
    'position:absolute;top:10px;right:50px;z-index:999;padding:6px;border-radius:4px;';
  panel.innerHTML = Object.keys(baseMaps)
    .map((nama) => `<option value="${nama}">${nama}</option>`)
    .join('');
  panel.addEventListener('change', (e) => switchBasemap(e.target.value));

  viewer.container.appendChild(panel);

  return { switchBasemap, baseMaps };
}