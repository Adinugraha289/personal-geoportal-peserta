export default function addPanelLayer3D(viewer, daftarLayer) {

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
    min-width:180px;
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

  viewer.container.appendChild(panel);

  return panel;
}