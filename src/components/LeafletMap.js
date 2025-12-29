import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import City from "../../public/assets/mock-data/list-station";

// Ensure each city has at least 15 stations by duplicating nearby coordinates when needed
const locations = City.flatMap((cityData) => {
  const base = cityData.stations.map((station) => ({
    city: cityData.city,
    lat: parseFloat(station.lat),
    lng: parseFloat(station.lng),
    name: station.name,
  }));

  if (base.length >= 15) return base;

  const augmented = [...base];
  let i = 0;
  while (augmented.length < 15) {
    const src = base[i % base.length];
    const offset = (Math.random() - 0.5) * 0.002; // ~ up to ~200m
    const offset2 = (Math.random() - 0.5) * 0.002;
    augmented.push({
      city: src.city,
      lat: parseFloat((src.lat + offset).toFixed(6)),
      lng: parseFloat((src.lng + offset2).toFixed(6)),
      name: `${src.name} (Phụ ${augmented.length + 1})`,
    });
    i++;
  }

  return augmented;
});

const LeafletMap = ({ center }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Check if map element exists in DOM
    const mapElement = document.getElementById("map");
    if (!mapElement) {
      console.warn("Map element not found");
      return;
    }

    try {
      const map = L.map("map").setView([10.7769, 106.7009], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const bikeIcon = L.divIcon({
        html: `
        <div style="
          width: 44px;
          height: 44px;
          background: white;
          border: 5px solid orange;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          position: relative;

        ">
          <img src="https://cdn-icons-png.flaticon.com/512/2972/2972185.png"
               style="width: 24px; height: 24px;"/>
          <div style="
            position: absolute;
            bottom: -10px;
            left: 50%;
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 10px solid orange;
            transform: translateX(-50%);
          "></div>
        </div>
      `,
        className: "",
        iconSize: [44, 54], // Kích thước tổng thể của icon
        iconAnchor: [22, 54], // Điểm neo của icon để marker hiển thị chính xác
        popupAnchor: [0, -50],
      });

      locations.forEach((loc) => {
        if (!loc.lat || !loc.lng || isNaN(loc.lat) || isNaN(loc.lng)) {
          return;
        }
        L.marker([loc.lat, loc.lng], { icon: bikeIcon })
          .addTo(map)
          .bindPopup(loc.name);
      });

      // Store map instance in ref for cleanup
      mapRef.current = map;

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
        }
      };
    } catch (error) {
      console.error("LeafletMap error:", error);
    }
  }, []);

  // Update map center when center prop changes
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setView([center.lat, center.lng], 16, {
        animate: true,
        duration: 1,
      });
    }
  }, [center]);

  return <div id="map" className="min-h-[700px] h-auto w-full relative z-0" />;
};

export default LeafletMap;
