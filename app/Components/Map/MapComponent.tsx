"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import L from "leaflet";
import HoverLocationPopup from "./HoverLocationPopup";
import RouteControl from "./RouteControl";
import LocationSearchInput from "./LocationSearchInput";

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

  const [start, setStart] = useState<[number, number] | null>(null);
  const [end, setEnd] = useState<[number, number] | null>(null);

  // useEffect(() => {
  //   setStart([23.82597333058035, 90.4265195131302]);
  //   setEnd([23.823917178929722, 90.42936265468597]);
  // }, []);

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
        {/* Controls */}
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

        {/* Map Container */}
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
          <RouteControl start={start} end={end} />
          <CursorController drawing={drawing} />
          {/* <HoverLocationPopup /> */}
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
          <label className="mb-1 hidden md:block">Source:</label>
          <LocationSearchInput
            placeholder="Search source..."
            onSelect={(coords, label) => setStart(coords)}
          />
        </div>
        <div className="mb-4">
          <label className="mb-1 hidden md:block">Destination:</label>
          <LocationSearchInput
            placeholder="Search destination..."
            onSelect={(coords, label) => setEnd(coords)}
          />
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

  const handleDrag = (index: number, newLat: number, newLng: number) => {
    const updated = [...polyPoints];
    updated[index] = [newLat, newLng];
    setPolyPoints(updated);
  };

  return (
    <>
      {polyPoints.length > 0 && (
        <Polyline positions={polyPoints} color="blue" />
      )}

      {polyPoints.map((point, i) => (
        <Marker
          key={i}
          position={point}
          draggable={true}
          icon={L.divIcon({
            html: `
              <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                <div style="
                  width: 12px;
                  height: 12px;
                  background: red;
                  border-radius: 50%;
                  border: 2px solid white;
                "></div>
                <div style="
                  position: absolute;
                  top: -22px;
                  background: white;
                  color: black;
                  font-size: 12px;
                  font-weight: bold;
                  padding: 1px 4px;
                  border-radius: 4px;
                  border: 1px solid #ccc;
                  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                ">
                  ${i + 1}
                </div>
              </div>
            `,
            iconSize: [20, 20],
            className: "custom-marker",
          })}
          eventHandlers={{
            dragend: (e) => {
              const latlng = e.target.getLatLng();
              handleDrag(i, latlng.lat, latlng.lng);
            },
          }}
        />
      ))}
    </>
  );
}

function CursorController({ drawing }: { drawing: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    container.style.cursor = drawing ? "crosshair" : "grab";
  }, [drawing, map]);

  return null;
}
