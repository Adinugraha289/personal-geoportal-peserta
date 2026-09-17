export default function add3DTileset(viewer, opsi, selesai) {
  const Cesium = window.Cesium;

   const {
    url,
    assetId,
    nama = '3D Tiles',
    otomatisZoom = true,
   } = opsi;
  
   let proses; 

   if (assetId) {
    proses = Cesium.Cesium3DTileset.fromIonAssetId(assetId);
   } else if (url) {
     proses = Cesium.Cesium3DTileset.fromUrl(url);
   } else {
     if (selesai) selesai(null);
     return;
   }

   proses.then(function (tileset) {
      tileset.show = true;
      viewer.scene.primitives.add(tileset);

      if (otomatisZoom) {
        viewer.zoomTo(tileset);
      }

      if (selesai) selesai(tileset); 
    })
    
}