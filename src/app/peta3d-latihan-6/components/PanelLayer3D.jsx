export default function addPanelLayer3D(viewer, daftarLayer, kontrolTerrain) {

  const panel = document.createElement('div');

  panel.style.cssText = `
    position:absolute;
    top:50px;
    right:50px;
    z-index:999;
    background:white;
    padding:10px 14px;
    border-radius:6px;
    font-family:sans-serif;
    font-size:13px;
    box-shadow:0 1px 6px rgba(0,0,0,0.3);
    min-width:200px;
    color:#111;
  `;

  panel.innerHTML = `
    <div style="font-weight:bold;margin-bottom:8px;color:#111;">
      Layer 3D 
    </div>
  `;

  Object.entries(daftarLayer).forEach(([nama, objek]) => {
    if (!objek) return;

    const baris = document.createElement('label');
    baris.style.cssText = `
      display:flex;
      align-items:center;
      gap:8px;
      margin-bottom:6px;
      cursor:pointer;
      color:#111;
    `;

    baris.innerHTML = `
      <input type="checkbox" checked />
      <span style="color:#111;">${nama}</span>
    `;

    baris.querySelector('input').addEventListener('change', (e) => {
      objek.show = e.target.checked;
    });

    panel.appendChild(baris);
  });

  if (kontrolTerrain) {
    const pemisah = document.createElement('div');
    pemisah.style.cssText = 'border-top:1px solid #ddd;margin:10px 0;padding-top:8px;';
    pemisah.innerHTML = `<div style="font-weight:bold;margin-bottom:8px;color:#111;">Terrain &amp; Citra</div>`;
    panel.appendChild(pemisah);

    const barisTerrain = document.createElement('label');
    barisTerrain.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer;color:#111;';
    barisTerrain.innerHTML = `
      <input type="checkbox" id="cbTerrain" ${kontrolTerrain.cekStatusAktif() ? 'checked' : ''} />
      <span>Aktifkan Terrain (DEM)</span>
    `;

    const cbTerrain = barisTerrain.querySelector('input');

    cbTerrain.addEventListener('change', (e) => {
      if (e.target.checked) {
        kontrolTerrain.aktifkanTerrain();
      } else {
        kontrolTerrain.matikanTerrain();
      }
    });

    if (kontrolTerrain.daftarkanListenerStatus) {
      kontrolTerrain.daftarkanListenerStatus((statusAktif) => {
        cbTerrain.checked = statusAktif;
      });
    }

    panel.appendChild(barisTerrain);

    const wrapOpacity = document.createElement('div');
    wrapOpacity.style.cssText = 'margin-bottom:8px;color:#111;';
    wrapOpacity.innerHTML = `
      <span>Transparansi Citra</span>
      <input type="range" id="rgOpacity" min="0" max="1" step="0.1" value="1" style="width:100%;" />
    `;
    wrapOpacity.querySelector('input').addEventListener('input', (e) => {
      kontrolTerrain.aturOpacityCitra(parseFloat(e.target.value));
    });
    panel.appendChild(wrapOpacity);
  }

  viewer.container.appendChild(panel);

  return panel;
}