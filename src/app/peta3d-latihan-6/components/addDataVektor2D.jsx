export default function addDataVektor2D(viewer, opsi, selesai) {
  const Cesium = window.Cesium;

  const {
    url,
    nama = 'Data Vektor 2D',
    warna = Cesium.Color.ORANGE,
    warnaOutline = Cesium.Color.BLACK,
    lebarGaris = 8,
    nempelTerrain = true,
    otomatisZoom = true,
  } = opsi;

  if (!url) {
    if (selesai) selesai(null);
    return;
  }

  Cesium.GeoJsonDataSource.load(url, {
    clampToGround: nempelTerrain,
  })
    .then(function (dataSource) {
      dataSource.name = nama;
      viewer.dataSources.add(dataSource);

      dataSource.entities.values.forEach(function (entity) {
        if (entity.polyline) {
          entity.polyline.material = new Cesium.PolylineOutlineMaterialProperty({
            color: warna,
            outlineWidth: 2,
            outlineColor: warnaOutline,
          });
          entity.polyline.width = lebarGaris;
          entity.polyline.clampToGround = nempelTerrain;
        }

        if (entity.polygon) {
          entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
        }
      });

      if (otomatisZoom) {
        viewer.flyTo(dataSource);
      }

      if (selesai) selesai(dataSource);
    })
}