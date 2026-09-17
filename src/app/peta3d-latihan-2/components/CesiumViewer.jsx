'use client';

import { useEffect, useRef, useState } from 'react';
import addLayerBasemap from './Basemap';
import add3DTileset from './add3DTileset';
import addPanelLayer3D from './PanelLayer3D';
import addModel3D from './addModel3D'; 

const CESIUM_VERSION = '1.120';
const CESIUM_BASE_URL = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/`;
const CESIUM_SCRIPT_URL = `${CESIUM_BASE_URL}Cesium.js`;
const CESIUM_STYLE_URL = `${CESIUM_BASE_URL}Widgets/widgets.css`;

const CESIUM_ION_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IkU4UjdQeC1aNERhWDBZdGQiLCJqdGkiOiI4YTllMzFmYS1kYWQ5LTRmOWEtOWIxNS1kZGUzZmI0YTk4ODEiLCJpZCI6NDc0NjE2LCJzdWIiOiJmemFhMjkiLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoibGF0aWhhbiAzRCIsImlhdCI6MTc4NzkzMjkwNX0.dsT6z2uVkDc0uj2P7G0x8XG63c87q7VfyWdOUwKg-zI';

const LOKASI_AWAL = {
  latitude: -6.2432495,
  longitude: 106.7979208,
  ketinggian: 2000,
  heading: 20,
  pitch: -35,
};

const VIEWER_OPTIONS = {
  timeline: false,
  animation: false,
  baseLayerPicker: false,
  geocoder: false,
  homeButton: true,
  navigationHelpButton: false,
  sceneModePicker: false,
  infoBox: false,
  selectionIndicator: false,
  shadows: true,
};

function LoadCesium(onBerhasil, onGagal) {
  if (window.Cesium) {
    onBerhasil();
    return;
  }

  const cssTag = document.createElement('link');
  cssTag.rel = 'stylesheet';
  cssTag.href = CESIUM_STYLE_URL;
  document.head.appendChild(cssTag);

  const scriptTag = document.createElement('script');
  scriptTag.src = CESIUM_SCRIPT_URL;
  scriptTag.async = true;
  scriptTag.onload = onBerhasil;
  scriptTag.onerror = () => onGagal('Gagal memuat CesiumJS dari CDN. Cek koneksi internet.');
  document.body.appendChild(scriptTag);
}

function createViewerCesium(container) {
  const Cesium = window.Cesium;
  Cesium.buildModuleUrl.setBaseUrl(CESIUM_BASE_URL);
  Cesium.Ion.defaultAccessToken = CESIUM_ION_TOKEN;

  const viewer = new Cesium.Viewer(container, {
    ...VIEWER_OPTIONS,
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    imageryProvider: false,
  });

  addLayerBasemap(viewer);
  viewer.scene.globe.depthTestAgainstTerrain = true;
  viewer.scene.globe.enableLighting = true;
  viewer.scene.light = new Cesium.SunLight();

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      LOKASI_AWAL.longitude,
      LOKASI_AWAL.latitude,
      LOKASI_AWAL.ketinggian
    ),
    orientation: {
      heading: Cesium.Math.toRadians(LOKASI_AWAL.heading),
      pitch: Cesium.Math.toRadians(LOKASI_AWAL.pitch),
      roll: 0,
    },
  });

  return viewer;
}

function addContent3D(viewer) {
  add3DTileset(
    viewer,
    {
      assetId: 96188,
      nama: 'Gedung 3D (OSM Buildings)',
      otomatisZoom: false,
    },
    function (gedung3D) {
      const modelBox = addModel3D(viewer, {
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
        latitude: LOKASI_AWAL.latitude,   
        longitude: LOKASI_AWAL.longitude,
        ketinggian: 30,   
        skala: 20,        
        heading: 0,
        nama: 'Bangunan Kotak (Contoh GLB)',
      });

      addPanelLayer3D(viewer, {
        'Gedung 3D (OSM Buildings)': gedung3D,
        'Bangunan Kotak (Contoh GLB)': modelBox,
      });
    }
  );
}

export default function CesiumViewer() {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [status, setStatus] = useState('memuat');

  useEffect(() => {
    LoadCesium(
      () => setStatus('siap'),
      (pesan) => {
        setPesanError(pesan);
        setStatus('error');
      }
    );
  }, []);

  useEffect(() => {
    if (status !== 'siap' || viewerRef.current) return;

    try {
      viewerRef.current = createViewerCesium(containerRef.current);

      addContent3D(viewerRef.current);
      
    } catch (err) {
      console.error('Cesium init error:', err);
      setPesanError('Gagal membuat peta. Cek console untuk detail.');
      setStatus('error');
    }

    return () => {
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [status]);


  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
}