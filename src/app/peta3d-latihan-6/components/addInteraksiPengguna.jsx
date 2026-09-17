export default function addInteraksiPengguna(viewer) {
  const Cesium = window.Cesium;

  const infoBox = document.createElement('div');
  infoBox.style.cssText = `
    position:absolute; bottom:30px; left:50px; z-index:999;
    background:white; padding:12px 16px; border-radius:6px;
    font-family:sans-serif; font-size:13px; max-width:300px;
    box-shadow:0 1px 6px rgba(0,0,0,0.3); color:#111; display:none;
  `;
  viewer.container.appendChild(infoBox);

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  handler.setInputAction(function (klik) {
    const objek = viewer.scene.pick(klik.position);

    if (!Cesium.defined(objek)) {
      infoBox.style.display = 'none';
      return;
    }

    let namaProperti = [];
    let judul = 'Info Objek';

    if (objek instanceof Cesium.Cesium3DTileFeature) {
      namaProperti = objek.getPropertyIds();
      judul = objek.getProperty('name') || 'Objek 3D Tiles';

      infoBox.innerHTML = `<b>${judul}</b><br>` +
        namaProperti.map((n) => `${n}: ${objek.getProperty(n)}`).join('<br>');

    } else if (objek.id && objek.id.properties) {
      namaProperti = objek.id.properties.propertyNames;
      judul = objek.id.name || 'Info Objek';

      infoBox.innerHTML = `<b>${judul}</b><br>` +
        namaProperti.map((n) => `${n}: ${objek.id.properties[n]?.getValue()}`).join('<br>');
    } else {
      infoBox.innerHTML = 'Tidak ada data untuk objek ini.';
    }

    infoBox.style.display = 'block';
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}