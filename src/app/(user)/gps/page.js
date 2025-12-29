"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import City from "../../../../public/assets/mock-data/list-station";

// Dynamic import map component để tránh lỗi window is not defined
const GPSMap = dynamic(() => import("@/components/GPSMap"), { ssr: false });

// Tính khoảng cách Haversine
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính trái đất (km)
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Lấy vị trí hiện tại
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Trình duyệt không hỗ trợ geolocation.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        reject(
          "Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập."
        );
      }
    );
  });
};

// Geocode địa chỉ
const geocodeAddress = async (address) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json`
  );
  const data = await response.json();
  if (!data.length) return null;
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
};

// Lấy tuyến đường
const fetchRoute = async (start, end) => {
  try {
    const response = await fetch(
      "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            process.env.NEXT_PUBLIC_OPENROUTE_API_KEY ||
            "5b3ce3597851110001cf62482db79a5e338e44d3b215892c5edac9ea",
        },
        body: JSON.stringify({
          coordinates: [
            [start[1], start[0]],
            [end[1], end[0]],
          ],
        }),
      }
    );

    if (!response.ok) throw new Error("Không thể lấy tuyến đường");
    return await response.json();
  } catch (error) {
    console.error("Route error:", error);
    return null;
  }
};

// Tìm trạm gần nhất
const findNearestStation = (location) => {
  let minDist = Infinity;
  let nearestStation = null;

  City.forEach((cityData) => {
    cityData.stations.forEach((station) => {
      const dist = haversineDistance(
        location[0],
        location[1],
        parseFloat(station.lat),
        parseFloat(station.lng)
      );
      if (dist < minDist) {
        minDist = dist;
        nearestStation = {
          ...station,
          city: cityData.city,
          distance: dist.toFixed(2),
        };
      }
    });
  });

  return nearestStation;
};

// Tìm nhiều trạm gần nhất (top 5)
const findNearestStations = (location, limit = 5) => {
  const stations = [];

  City.forEach((cityData) => {
    cityData.stations.forEach((station) => {
      const dist = haversineDistance(
        location[0],
        location[1],
        parseFloat(station.lat),
        parseFloat(station.lng)
      );
      stations.push({
        ...station,
        city: cityData.city,
        distance: parseFloat(dist.toFixed(2)),
      });
    });
  });

  // Sắp xếp theo khoảng cách và lấy top limit
  return stations.sort((a, b) => a.distance - b.distance).slice(0, limit);
};

export default function GPSPage() {
  const [address, setAddress] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [nearest, setNearest] = useState(null);
  const [nearestList, setNearestList] = useState(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [showMultiple, setShowMultiple] = useState(false);
  const [selectedStationRoute, setSelectedStationRoute] = useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Xử lý tìm kiếm
  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNearest(null);
    setNearestList(null);
    setRouteGeoJSON(null);

    try {
      let currentLocation;

      if (useCurrentLocation) {
        currentLocation = await getCurrentLocation();
        setUserLocation(currentLocation);
      } else {
        if (!address.trim()) {
          setError("Vui lòng nhập địa chỉ hoặc chọn vị trí hiện tại");
          setLoading(false);
          return;
        }
        currentLocation = await geocodeAddress(address);
        if (!currentLocation) {
          setError("Không tìm thấy địa chỉ. Vui lòng thử lại.");
          setLoading(false);
          return;
        }
        setUserLocation(currentLocation);
      }

      // Tìm trạm gần nhất
      const nearestStation = findNearestStation(currentLocation);
      setNearest(nearestStation);

      // Tìm 5 trạm gần nhất
      const nearestStations = findNearestStations(currentLocation, 5);
      setNearestList(nearestStations);

      if (nearestStation) {
        // Lấy tuyến đường
        const route = await fetchRoute(
          [currentLocation[0], currentLocation[1]],
          [nearestStation.lat, nearestStation.lng]
        );

        if (route) {
          setRouteGeoJSON(route);
        }
      }
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [address, useCurrentLocation]);

  // Xử lý chọn trạm từ danh sách
  const handleSelectStation = useCallback(
    async (station) => {
      setLoading(true);
      try {
        const route = await fetchRoute(
          [userLocation[0], userLocation[1]],
          [parseFloat(station.lat), parseFloat(station.lng)]
        );

        if (route) {
          setRouteGeoJSON(route);
          setNearest(station);
          setSelectedStationRoute(station);
        }
      } catch (err) {
        setError("Lỗi khi lấy tuyến đường: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [userLocation]
  );

  // Enter key handler
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSearch();
    }
  };

  if (!isClient) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center text-blue-600">
        🗺️ Tìm Trạm Gần Nhất
      </h1>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* Address Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nhập địa chỉ của bạn (ví dụ: 123 Nguyễn Huệ, Hồ Chí Minh)..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={useCurrentLocation || loading}
            className="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={handleSearch}
            disabled={loading || (!address.trim() && !useCurrentLocation)}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
          >
            {loading ? "Đang tìm..." : "Tìm"}
          </button>
        </div>

        {/* Current Location Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useCurrentLocation}
            onChange={(e) => setUseCurrentLocation(e.target.checked)}
            disabled={loading}
            className="w-4 h-4"
          />
          <span className="text-gray-700">
            📍 Sử dụng vị trí hiện tại của tôi
          </span>
        </label>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            ❌ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center text-blue-600 py-2">
            ⏳ Đang xử lý, vui lòng chờ...
          </div>
        )}
      </div>

      {/* Results Section */}
      {nearest && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border-l-4 border-blue-600">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📍 Trạm Gần Nhất
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tên trạm</p>
              <p className="text-lg font-semibold text-gray-800">
                {nearest.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Thành phố</p>
              <p className="text-lg font-semibold text-gray-800">
                {nearest.city}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Khoảng cách</p>
              <p className="text-lg font-semibold text-blue-600">
                {nearest.distance} km
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">{nearest.address}</p>
        </div>
      )}

      {/* Multiple Stations List */}
      {nearestList && nearestList.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              🔍 Top 5 Trạm Gần Nhất
            </h2>
            <button
              onClick={() => setShowMultiple(!showMultiple)}
              className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
            >
              {showMultiple ? "Ẩn" : "Hiển thị"}
            </button>
          </div>

          {showMultiple && (
            <div className="space-y-3">
              {nearestList.map((station, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition cursor-pointer"
                  onClick={() => handleSelectStation(station)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <p className="font-semibold text-gray-800">
                          {station.name}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {station.address}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Thành phố: {station.city}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-blue-600">
                        {station.distance} km
                      </p>
                      <button
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded mt-2 hover:bg-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectStation(station);
                        }}
                      >
                        Chỉ đường
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <GPSMap
        userLocation={userLocation}
        nearest={nearest}
        routeGeoJSON={routeGeoJSON}
      />
    </div>
  );
}
