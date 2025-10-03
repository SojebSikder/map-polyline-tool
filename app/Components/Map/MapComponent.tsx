"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SearchControl = dynamic<{}>(
  () => import("./SearchControl").then((mod) => mod.default),
  { ssr: false }
);

const tilesProviders = {
  google: "https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}",
  osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
};

type TileKeys = keyof typeof tilesProviders;

export default function MapComponent() {
  const [drawing, setDrawing] = useState(false);
  const [polyPoints, setPolyPoints] = useState<[number, number][]>([]);
  const [tileLayerUrl, setTileLayerUrl] = useState(tilesProviders.google);
  const [isSearchcontrolEnable, setisSearchcontrolEnable] = useState(false);

  const startDrawing = () => {
    setPolyPoints([]);
    setDrawing(true);
  };

  const finishDrawing = () => setDrawing(false);
  const clearPolyline = () => setPolyPoints([]);

  const handleSelectTile = (e: { target: { value: string } }) => {
    const selectedTile = e.target.value as TileKeys;
    const tileUrl = tilesProviders[selectedTile];
    if (tileUrl) {
      setTileLayerUrl(tileUrl);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    if (type === "success") {
      toast.success(message, { autoClose: 2000, position: "bottom-right" });
    } else {
      toast.error(message, { autoClose: 2000, position: "bottom-right" });
    }
  };

  const handleCopyToClipboard = async () => {
    const coordText = polyPoints
      .map((point) => `${point[0]}, ${point[1]}`)
      .join("\n");

    try {
      await navigator.clipboard.writeText(coordText);
      showToast("Coordinates copied to clipboard!", "success");
    } catch (error) {
      showToast("Failed to copy coordinates.", "error");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      <ToastContainer />

      {/* Map */}
      <div className="relative flex-1 h-[60vh] md:h-screen">
        <div
          className="absolute top-2 left-12 z-[1000] bg-white p-2 rounded-lg shadow-md flex gap-2"
          style={{ pointerEvents: "auto" }}
        >
          <button
            className="btn px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
            onClick={startDrawing}
            disabled={drawing}
          >
            Start
          </button>
          <button
            className="btn px-3 py-1 bg-green-500 text-white rounded disabled:opacity-50"
            onClick={finishDrawing}
            disabled={!drawing}
          >
            Finish
          </button>
          <button
            className="btn px-3 py-1 bg-red-500 text-white rounded disabled:opacity-50"
            onClick={clearPolyline}
            disabled={polyPoints.length === 0}
          >
            Clear
          </button>
          <button
            className="btn px-3 py-1 bg-gray-500 text-white rounded"
            onClick={() => {
              setisSearchcontrolEnable(!isSearchcontrolEnable);
            }}
          >
            Search
          </button>
        </div>

        <MapContainer
          center={[23.8103, 90.4125]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer id="tileLayer" url={tileLayerUrl} />
          <PolylineDrawer
            drawing={drawing}
            polyPoints={polyPoints}
            setPolyPoints={setPolyPoints}
          />
          {isSearchcontrolEnable && <SearchControl />}
        </MapContainer>
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-[300px] p-4 bg-gray-100 overflow-y-auto">
        <div className="mb-4">
          <label className="mb-1 hidden md:block">Select Map Tile:</label>
          <select
            name="tile"
            id="tile"
            className="w-full p-2 border rounded"
            onChange={handleSelectTile}
          >
            <option value="google">Google Map</option>
            <option value="osm">Open Street Map</option>
          </select>
        </div>

        <div className="mb-1">
          <button
            className="btn w-full px-3 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
            onClick={handleCopyToClipboard}
            disabled={polyPoints.length === 0}
          >
            Copy Coordinates
          </button>
        </div>

        <h3 className="font-semibold mb-2">Coordinates</h3>
        <div className="max-h-[100px] md:max-h-[400px] lg:max-h-[600px] overflow-y-auto border p-2 rounded bg-white">
          {polyPoints.length === 0 && (
            <p className="text-gray-500">No points yet</p>
          )}
          <ul className="text-sm">
            {polyPoints.map((point, i) => (
              <li key={i} className="border-b py-1">
                {point[0]}, {point[1]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Polyline Drawer
type PolylineDrawerProps = {
  drawing: boolean;
  polyPoints: [number, number][];
  setPolyPoints: React.Dispatch<React.SetStateAction<[number, number][]>>;
};

export function PolylineDrawer({
  drawing,
  polyPoints,
  setPolyPoints,
}: PolylineDrawerProps) {
  useMapEvents({
    click(e) {
      if (drawing) {
        setPolyPoints([...polyPoints, [e.latlng.lat, e.latlng.lng]]);
      }
    },
  });

  return (
    <>
      {polyPoints.length > 0 && (
        <Polyline positions={polyPoints} color="blue" />
      )}
      {polyPoints.map((point, i) => (
        <CircleMarker key={i} center={point} radius={5} color="red" />
      ))}
    </>
  );
}
