export default function addModel3D(viewer, opsi) {
  const Cesium = window.Cesium;

   const {
    url,
    latitude,
    longitude,
    ketinggian = 0,
    skala = 1,
    heading = 0,
    nama = 'Model 3D',
  } = opsi;

  const posisi = Cesium.Cartesian3.fromDegrees(longitude, latitude, ketinggian);  

  const orientasi = Cesium.Transforms.headingPitchRollQuaternion(
    posisi,
    new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(heading), 0, 0)
  );

   return viewer.entities.add({
    name: nama,
    position: posisi,
    orientation: orientasi,
    show: true,
    model: {
      uri: url,
      scale: skala,
      minimumPixelSize: 64,
    },
  });

}