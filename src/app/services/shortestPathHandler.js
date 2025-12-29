const fetch = require("node-fetch");

// Decode Google encoded polyline to array of [lat, lng]
function decodePolyline(encoded) {
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;
  const coordinates = [];

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}

async function getShortestPath(userLat, userLng, stationLat, stationLng) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY";
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${userLat},${userLng}&destination=${stationLat},${stationLng}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const overview = data.routes[0].overview_polyline?.points;
      if (overview) {
        const coords = decodePolyline(overview);
        // Return full route as GeoJSON LineString for map display
        return {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                distance: data.routes[0].legs?.[0]?.distance?.value || null,
                duration: data.routes[0].legs?.[0]?.duration?.value || null,
              },
              geometry: {
                type: "LineString",
                coordinates: coords,
              },
            },
          ],
        };
      }

      // Fallback: return steps as before
      return data.routes[0].legs[0].steps;
    } else {
      throw new Error("Không tìm thấy đường đi.");
    }
  } catch (error) {
    console.error("Lỗi API:", error);
    return null;
  }
}

module.exports = getShortestPath;
