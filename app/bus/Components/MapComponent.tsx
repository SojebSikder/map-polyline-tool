"use client";

import { showToast } from "@/helper/toast";
import { useState, useRef } from "react";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapComponent({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const [source, setSource] = useState("khilkhet");
  const [destination, setDestination] = useState("tongi");
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [busList, setBusList] = useState([]);
  const [fare, setFare] = useState(null);

  const mapRef = useRef<any>(null);

  const handleGetFare = async () => {
    if (!source || !destination) {
      showToast("Please enter both source and destination!", "error");
      return;
    }

    try {
      const url = `http://localhost:8080/api/bus?source=${encodeURIComponent(
        source
      )}&destination=${encodeURIComponent(destination)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();
      const coords: [number, number][] = data.data.coords;

      if (!coords || coords.length === 0) {
        showToast("No coordinates returned!", "error");
        setCoordinates([]);
        setFare(null);
        setBusList([]);
        return;
      }

      setCoordinates(coords);
      setFare(data.data.fare);
      setBusList(data.data.bus);
      showToast("Route loaded successfully!", "success");

      // Fit map to bounds
      if (mapRef.current) {
        const map = mapRef.current;
        const latLngs = coords.map(
          ([lat, lng]) => [lat, lng] as [number, number]
        );
        map.fitBounds(latLngs as any, { padding: [50, 50] });
      }
    } catch (error) {
      console.error(error);
      showToast("API call failed.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg mb-6">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-4">
          {title}
        </h1>
        <p className="text-gray-700 text-center mb-6">{description}</p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder="Destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
            onClick={handleGetFare}
          >
            Get Fare
          </button>
        </div>

        {fare && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-300">
            <h2 className="font-semibold mb-2">Bus fare:</h2>
            <pre className="text-sm">{fare}</pre>
          </div>
        )}

        {busList && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-300">
            <h2 className="font-semibold mb-2">Bus list:</h2>
            <ul>
              {busList.map((bus) => {
                return <li className="text-sm">{bus}</li>;
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Leaflet Map */}
      <div className="w-full max-w-4xl h-[500px] rounded-lg overflow-hidden shadow-lg">
        <MapContainer
          center={[23.8103, 90.4125]} // default center (Dhaka)
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}"
            attribution="&copy; OpenStreetMap contributors"
          />
          {coordinates.length > 0 && (
            <Polyline positions={coordinates} color="blue" />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
