"use client";

import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const stationIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function GPSMap({ userLocation, nearest, routeGeoJSON }) {
  const [mapInstance, setMapInstance] = useState(null);

  // Handler để fit bounds của route trên map - hiển thị 100% đường đi
  const handleRouteLoaded = (map) => {
    if (
      map &&
      routeGeoJSON &&
      routeGeoJSON.features &&
      routeGeoJSON.features.length > 0
    ) {
      try {
        const bounds = L.geoJSON(routeGeoJSON).getBounds();
        if (bounds && bounds.isValid()) {
          // Thêm padding để hiển thị full đường
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 17 });
        }
      } catch (e) {
        console.error("Error fitting bounds:", e);
      }
    }
  };

  // Khi userLocation thay đổi, tự động zoom đến vị trí
  useEffect(() => {
    if (mapInstance && userLocation) {
      mapInstance.setView(userLocation, 16, { animate: true, duration: 1 });
    }
  }, [userLocation, mapInstance]);

  // Khi routeGeoJSON thay đổi, fit bounds để hiển thị toàn bộ đường
  useEffect(() => {
    if (mapInstance && routeGeoJSON) {
      setTimeout(() => {
        handleRouteLoaded(mapInstance);
      }, 500);
    }
  }, [routeGeoJSON, mapInstance]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="h-[700px] w-full">
        <MapContainer
          center={userLocation ?? [10.7769, 106.7009]}
          zoom={userLocation ? 15 : 13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          whenCreated={setMapInstance}
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {userLocation && (
            <Marker position={userLocation} icon={userIcon}>
              <Popup>
                <strong>Vi tri cua ban</strong>
                <br />
                {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
              </Popup>
            </Marker>
          )}

          {nearest && (
            <Marker
              position={[parseFloat(nearest.lat), parseFloat(nearest.lng)]}
              icon={stationIcon}
            >
              <Popup>
                <strong>{nearest.name}</strong>
                <br />
                Cach ban: <strong>{nearest.distance} km</strong>
                <br />
                <small>{nearest.address}</small>
              </Popup>
            </Marker>
          )}

          {routeGeoJSON &&
            routeGeoJSON.features &&
            routeGeoJSON.features.length > 0 && (
              <GeoJSON
                data={routeGeoJSON}
                style={(feature) => ({
                  color: "#2563eb",
                  weight: 5,
                  opacity: 0.9,
                  dashArray: "5, 5",
                })}
                onEachFeature={(feature, layer) => {
                  if (feature.properties?.distance) {
                    layer.bindPopup(
                      `Tuyen duong: ${(
                        feature.properties.distance / 1000
                      ).toFixed(2)} km`
                    );
                  }
                }}
              />
            )}
        </MapContainer>
      </div>
      {routeGeoJSON &&
        routeGeoJSON.features &&
        routeGeoJSON.features.length > 0 && (
          <div className="bg-blue-50 p-3 border-t border-blue-200">
            <p className="text-sm text-gray-700">
              Duong di tu vi tri cua ban den tram gan nhat. Map tu dong zoom va
              hien thi toan bo duong.
            </p>
          </div>
        )}
    </div>
  );
}
