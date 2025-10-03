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


const SearchControl = dynamic<{}>(
  () => import("./SearchControl").then((mod) => mod.default),
  { ssr: false }
);

const tilesProviders = {
  google: "https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}",
  osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
};

type TileKeys = keyof typeof tilesProviders;

export default function ClientComponent() {
  const [drawing, setDrawing] = useState(false);
  const [polyPoints, setPolyPoints] = useState<[number, number][]>([]);
  const [tileLayerUrl, setTileLayerUrl] = useState(tilesProviders.google);

  const startDrawing = () => {
    setPolyPoints([]);
    setDrawing(true);
  };

  const finishDrawing = () => setDrawing(false);
  const clearPolyline = () => setPolyPoints([]);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%" }}>
      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 50,
            zIndex: 1000,
            background: "white",
            padding: "10px",
            borderRadius: "8px",
            pointerEvents: "auto",
          }}
        >
          <button className="btn" onClick={startDrawing} disabled={drawing}>
            Start
          </button>
          <button className="btn" onClick={finishDrawing} disabled={!drawing}>
            Finish
          </button>
          <button
            className="btn"
            onClick={clearPolyline}
            disabled={polyPoints.length === 0}
          >
            Clear
          </button>
        </div>

        <MapContainer
          center={[23.8103, 90.4125]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          {/* <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /> */}
          {/* <TileLayer
            url={`https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}`}
          /> */}
          <TileLayer
            id="tileLayer"
            url={tileLayerUrl}
          />
          <PolylineDrawer
            drawing={drawing}
            polyPoints={polyPoints}
            setPolyPoints={setPolyPoints}
          />
          <SearchControl />
        </MapContainer>
      </div>

      {/* Right Sidebar */}
      <div
        style={{
          width: "300px",
          padding: "10px",
          background: "#f5f5f5",
          overflowY: "auto",
        }}
      >
        <div className="mb-4">
          <label htmlFor="">Select Map tile:</label>
          <select
            name="tile"
            id="tile"
            className="w-full p-2 border"
            onChange={(e) => {
              const selectedTile = e.target.value as TileKeys;
              const tileUrl = tilesProviders[selectedTile];
              if (tileUrl) {
                setTileLayerUrl(tileUrl);
              }
            }}
          >
            <option value="google">Google Map</option>
            <option value="osm">Open Street Map</option>
          </select>
        </div>

        {/* Copy button */}
        <div className="mb-4">
          <button
            className="btn w-full"
            onClick={() => {
              const coordText = polyPoints
                .map((point) => `${point[0]}, ${point[1]}`)
                .join("\n");
              navigator.clipboard.writeText(coordText);
            }}
            disabled={polyPoints.length === 0}
          >
            Copy Coordinates
          </button>
        </div>
        
        <h3>Coordinates</h3>
        <div>
          {polyPoints.length === 0 && <p>No points yet</p>}
          <ul>
            {polyPoints.map((point, i) => (
              <li key={i}>
                {/* {i + 1}: Lat {point[0].toFixed(6)}, Lng {point[1].toFixed(6)} */}
                {point[0]}, {point[1]}
                <hr />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Component to handle polyline drawing
type PolylineDrawerProps = {
  drawing: boolean;
  polyPoints: [number, number][];
  setPolyPoints: React.Dispatch<React.SetStateAction<[number, number][]>>;
};

export function PolylineDrawer({ drawing, polyPoints, setPolyPoints }: PolylineDrawerProps) {
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

