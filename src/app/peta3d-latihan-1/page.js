'use client';

import dynamic from 'next/dynamic';

const CesiumViewer = dynamic(() => import('./components/CesiumViewer'), {
  ssr: false,
  loading: () => <p style={{ padding: 20 }}>Memuat peta 3D...</p>,
});

export default function Page() {
  return (
    <main>
      <CesiumViewer />
    </main>
  );
}