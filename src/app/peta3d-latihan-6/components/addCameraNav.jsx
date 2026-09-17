export default function addCameraNav(viewer, opsi = {}) {
  const Cesium = window.Cesium;

  const { lokasiAwal = null, tampilkanPanel = true } = opsi;

  function lihatLangsung(latitude, longitude, ketinggian, heading = 0, pitch = -30, roll = 0) {
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, ketinggian),
      orientation: {
        heading: Cesium.Math.toRadians(heading),
        pitch: Cesium.Math.toRadians(pitch),
        roll: Cesium.Math.toRadians(roll),
      },
    });
  }

  function terbangKe(latitude, longitude, ketinggian, heading = 0, pitch = -30, roll = 0) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, ketinggian),
      orientation: {
        heading: Cesium.Math.toRadians(heading),
        pitch: Cesium.Math.toRadians(pitch),
        roll: Cesium.Math.toRadians(roll),
      },
    });
  }

  function resetKeAwal() {
    if (!lokasiAwal) return;
    terbangKe(
      lokasiAwal.latitude,
      lokasiAwal.longitude,
      lokasiAwal.ketinggian,
      lokasiAwal.heading ?? 0,
      lokasiAwal.pitch ?? -30,
      lokasiAwal.roll ?? 0
    );
  }

  function putarKiri() {
    const headingSekarang = viewer.camera.heading;
    viewer.camera.setView({
      orientation: {
        heading: headingSekarang - Cesium.Math.toRadians(15),
        pitch: viewer.camera.pitch,
        roll: viewer.camera.roll,
      },
    });
  }

  function putarKanan() {
    const headingSekarang = viewer.camera.heading;
    viewer.camera.setView({
      orientation: {
        heading: headingSekarang + Cesium.Math.toRadians(15),
        pitch: viewer.camera.pitch,
        roll: viewer.camera.roll,
      },
    });
  }

  if (tampilkanPanel) {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position:absolute;
      bottom:30px;
      left:50%;
      transform:translateX(-50%);
      z-index:999;
      background:white;
      padding:8px 12px;
      border-radius:8px;
      font-family:sans-serif;
      font-size:13px;
      box-shadow:0 1px 6px rgba(0,0,0,0.3);
      display:flex;
      gap:6px;
      color:#111;
    `;

    const tombolStyle = `
      padding:6px 10px;
      border:1px solid #ccc;
      border-radius:6px;
      background:#f5f5f5;
      cursor:pointer;
      font-size:12px;
      color:#111;
    `;

    const daftarTombol = [
      { label: 'Kiri', aksi: () => putarKiri() },
      { label: 'Kanan', aksi: () => putarKanan() },
      { label: 'Reset', aksi: () => resetKeAwal() },
    ];

    daftarTombol.forEach(({ label, aksi }) => {
      const tombol = document.createElement('button');
      tombol.innerText = label;
      tombol.style.cssText = tombolStyle;
      tombol.addEventListener('click', aksi);
      panel.appendChild(tombol);
    });

    viewer.container.appendChild(panel);
  }

  return { lihatLangsung, terbangKe, resetKeAwal, putarKiri, putarKanan };
}