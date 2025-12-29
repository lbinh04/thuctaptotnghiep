"use client"; // Đảm bảo chỉ chạy trên client-side

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

const MapComponent = dynamic(() => import("./LeafletMap"), { ssr: false });

const BikeMap = ({ mapCenter }) => {
  const [center, setCenter] = useState(
    mapCenter || { lat: 21.0285, lng: 105.8542 }
  );

  useEffect(() => {
    if (mapCenter) {
      setCenter(mapCenter);
    }
  }, [mapCenter]);

  return (
    <div>
      <MapComponent center={center} />
    </div>
  );
};

export default BikeMap;
