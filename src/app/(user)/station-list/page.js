"use client";
import React, { useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { IoLocationSharp } from "react-icons/io5";
import City from "../../../../public/assets/mock-data/list-station";
import BikeMap from "@/components/bike-map";

// Tọa độ các thành phố
const CITY_COORDINATES = {
  "Hồ Chí Minh": { lat: 10.7769, lng: 106.7009 },
  "Vũng Tàu": { lat: 10.3577, lng: 107.0842 },
  "Hà Nội": { lat: 21.0285, lng: 105.8542 },
  "Đà Nẵng": { lat: 16.0471, lng: 108.2068 },
  "Hải Phòng": { lat: 20.8449, lng: 106.6881 },
};

const ListStation = () => {
  const [rotatedItems, setRotatedItems] = useState({});
  const [open, setOpen] = useState(null);
  const [selectedCity, setSelectedCity] = useState("Tất cả");
  const [keyword, setKeyword] = useState("");
  const [filteredStations, setFilteredStations] = useState(City);
  const [mapCenter, setMapCenter] = useState({ lat: 21.0285, lng: 105.8542 });

  const toggleItem = (index) => {
    setRotatedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
    setOpen(open === index ? null : index);
  };

  const handleSearch = () => {
    let filtered = City.filter(
      (city) =>
        selectedCity === "Tất cả" ||
        city.city.toLowerCase() === selectedCity.toLowerCase()
    );

    filtered = filtered.map((city) => ({
      ...city,
      stations: city.stations.filter(
        (station) =>
          station.name.toLowerCase().includes(keyword.toLowerCase()) ||
          station.address.toLowerCase().includes(keyword.toLowerCase())
      ),
    }));

    setFilteredStations(filtered);

    // Mở danh sách trạm của tất cả thành phố phù hợp
    const newRotatedItems = {};
    filtered.forEach((city, index) => {
      if (city.stations.length > 0) {
        newRotatedItems[index] = true;
      }
    });
    setRotatedItems(newRotatedItems);
  };

  const handleLocationClick = (lat, lng) => {
    setMapCenter({ lat, lng });
  };

  const handleCityClick = (cityName) => {
    const coords = CITY_COORDINATES[cityName];
    if (coords) {
      setMapCenter(coords);
    }
  };

  return (
    <>
      <div className="flex">
        <div className="w-[400px]">
          <div className="bg-blue-600 p-4 text-center">
            <h2 className="uppercase text-xl text-white">danh sách trạm</h2>
          </div>
          <div className="px-4 pb-2 border-r">
            <div className="my-2">
              <label
                htmlFor="city"
                className="block text-gray-700 font-medium mb-1"
              >
                Thành phố
              </label>
              <select
                id="city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option>Tất cả</option>
                {City.map((city, index) => (
                  <option key={index} value={city.city}>
                    {city.city}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label
                htmlFor="keyword"
                className="block text-gray-700 font-medium mt-4 mb-1"
              >
                Từ khóa
              </label>
              <input
                id="keyword"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tên quận, đường, trạm xe..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSearch}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition duration-200"
            >
              Tìm kiếm
            </button>
          </div>

          <div className="flex flex-col max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            {filteredStations.map((item, index) => (
              <React.Fragment key={index}>
                <button
                  className="py-4 px-5 flex items-center justify-between border-r border-b focus:bg-blue-200 hover:bg-blue-50 transition cursor-pointer group"
                  onClick={() => {
                    toggleItem(index);
                    handleCityClick(item.city);
                  }}
                  title={`Xem ${item.city} trên bản đồ`}
                >
                  <strong className="group-hover:text-blue-600">
                    {item.city}
                  </strong>
                  <IoIosArrowDown
                    className={`text-2xl transition-transform duration-300 ${
                      rotatedItems[index] ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>
                {rotatedItems[index] && (
                  <div className="p-4 bg-gray-100">
                    {item.stations.map((station, i) => (
                      <div
                        className="flex items-center border-b mb-0.5"
                        key={i}
                      >
                        <div className="py-2 px-4 w-[80%]">
                          <b>{station.name}</b>
                          <div className="text-sm">{station.address}</div>
                        </div>
                        <button
                          className="py-2 px-4 hover:bg-red-100 rounded transition"
                          onClick={() =>
                            handleLocationClick(station.lat, station.lng)
                          }
                          title="Xem vị trí trên bản đồ"
                        >
                          <IoLocationSharp className="text-red-500 text-3xl" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="w-[calc(100vw-400px)]">
          <BikeMap mapCenter={mapCenter} className="-z-50" />
        </div>
      </div>
    </>
  );
};

export default ListStation;
