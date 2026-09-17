"use client";

import dynamic from "next/dynamic";

const MapWrapper = dynamic(() => import("./Map"), { ssr: false });

export default MapWrapper;