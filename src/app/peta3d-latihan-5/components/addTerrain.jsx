export default function addTerrain(viewer, opsi = {}) {
  const Cesium = window.Cesium;

  const {
    aktifTerrainAwal = true,
    onStatusBerubah = null,     
    onLoadingBerubah = null,    
  } = opsi;

  const permukaanDatar = new Cesium.EllipsoidTerrainProvider();
  let terrainAktif = false;
  const daftarListenerStatus = [];

  function beritahuStatus(status) {
    if (onStatusBerubah) onStatusBerubah(status);
    daftarListenerStatus.forEach((cb) => cb(status));
  }

  function daftarkanListenerStatus(cb) {
    if (typeof cb !== 'function') return;
    daftarListenerStatus.push(cb);
    cb(terrainAktif); 
  }

  function aktifkanTerrain() {
    if (onLoadingBerubah) onLoadingBerubah(true);

    Cesium.createWorldTerrainAsync({
      requestVertexNormals: true,
    })
      .then(function (worldTerrain) {
        viewer.terrainProvider = worldTerrain;
        terrainAktif = true;
        beritahuStatus(true);
        console.log('Terrain (DEM) berhasil diaktifkan.');
      })
      .finally(function () {
        if (onLoadingBerubah) onLoadingBerubah(false);
      });
  }

  function matikanTerrain() {
    viewer.terrainProvider = permukaanDatar; 
    terrainAktif = false;
    beritahuStatus(false);
  }

  function toggleTerrain() {
    terrainAktif ? matikanTerrain() : aktifkanTerrain();
  }

  function aturOpacityCitra(nilai) {
    const jumlahLayer = viewer.imageryLayers.length;
    for (let i = 0; i < jumlahLayer; i++) {
      viewer.imageryLayers.get(i).alpha = nilai;
    }
  }

  if (aktifTerrainAwal) {
    aktifkanTerrain();
  } else {
    viewer.terrainProvider = permukaanDatar;
  }

  return {
    aktifkanTerrain,
    matikanTerrain,
    toggleTerrain,
    aturOpacityCitra,
    daftarkanListenerStatus,
    cekStatusAktif: function () {
      return terrainAktif;
    },
  };
}