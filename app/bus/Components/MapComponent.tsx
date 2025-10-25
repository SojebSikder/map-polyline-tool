"use client";

import { showToast } from "@/helper/toast";
import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ToastContainer } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type BusData = {
  coordinates?: [number, number][];
  bus_lists?: string[];
  fare?: number | null;
  distance?: number | null;
  travel_time?: number | null;
};

export default function MapComponent({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const [source, setSource] = useState("Khilkhet (খিলক্ষেত)");
  const [destination, setDestination] = useState("Khamar Bari (খামার বাড়ি)");
  const [busData, setBusData] = useState<BusData>();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [loading, setLoading] = useState(false);

  const [sourceSuggestions, setSourceSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>(
    []
  );

  const sourceRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [reqSent, setReqSent] = useState(false);

  const debounce = (fn: Function, delay = 300) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };

  const fetchSuggestions = async (
    query: string,
    type: "source" | "destination"
  ) => {
    if (!query) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/bus/location/search?q=${encodeURIComponent(query)}`
      );

      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();

      if (type === "source") setSourceSuggestions(data.data);
      else setDestinationSuggestions(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const debouncedFetchSource = useRef(
    debounce((q: string) => fetchSuggestions(q, "source"))
  ).current;
  const debouncedFetchDestination = useRef(
    debounce((q: string) => fetchSuggestions(q, "destination"))
  ).current;

  const handleGetFare = async () => {
    if (!source || !destination) {
      showToast("Please enter both source and destination!", "error");
      return;
    }

    try {
      setLoading(true);
      setReqSent(true);

      const url = `${API_BASE_URL}/api/bus?source=${encodeURIComponent(
        source
      )}&destination=${encodeURIComponent(destination)}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();
      const coords: [number, number][] = data.data.coordinates;

      if (!coords || coords.length === 0) {
        showToast("No coordinates returned!", "error");

        setBusData({
          fare: null,
          coordinates: [],
          bus_lists: [],
          travel_time: null,
          distance: null,
        });
        return;
      }

      setBusData({
        fare: data.data.fare,
        coordinates: coords,
        bus_lists: data.data.bus,
        distance: data.data.distance / 1000,
        travel_time: data.data.travel_time,
      });
      showToast("Route fetched successfully!", "success");

      if (mapRef.current) {
        const map = mapRef.current;
        const latLngs = coords.map(
          ([lat, lng]) => [lat, lng] as [number, number]
        );
        map.fitBounds(latLngs as any, { padding: [50, 50] });
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Close suggestion dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sourceRef.current &&
        !sourceRef.current.contains(event.target as Node)
      ) {
        setSourceSuggestions([]);
      }
      if (
        destinationRef.current &&
        !destinationRef.current.contains(event.target as Node)
      ) {
        setDestinationSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const colors = {
    light: {
      bgPage: "bg-gray-100",
      bgCard: "bg-white",
      textCard: "text-gray-900",
      bgInput: "bg-white",
      textInput: "text-gray-900",
      borderInput: "border-gray-300",
      bgPanel: "bg-gray-100",
      borderPanel: "border-gray-300",
      title: "text-blue-600",
      polyline: "blue",
      button: "bg-blue-500 hover:bg-blue-600 text-white",
      activeButton: "bg-blue-700",
    },
    dark: {
      bgPage: "bg-gray-900",
      bgCard: "bg-gray-800",
      textCard: "text-gray-100",
      bgInput: "bg-gray-700",
      textInput: "text-gray-100",
      borderInput: "border-gray-600",
      bgPanel: "bg-gray-700",
      borderPanel: "border-gray-600",
      title: "text-blue-400",
      polyline: "blue",
      button: "bg-blue-500 hover:bg-blue-600 text-white",
      activeButton: "bg-blue-700",
    },
  };

  const currentColors = colors[theme];

  return (
    <div
      className={`${currentColors.bgPage} min-h-screen flex flex-col md:flex-row items-center justify-center p-4 md:p-6 gap-4`}
    >
      <ToastContainer />
      {/* Left Panel */}
      <div
        className={`${currentColors.bgCard} shadow-lg rounded-lg p-6 w-full md:max-w-lg ${currentColors.textCard}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h1
            className={`text-2xl md:text-3xl font-bold text-center ${currentColors.title}`}
          >
            {title}
          </h1>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="ml-2 px-3 py-1 rounded-lg border border-gray-400 text-sm"
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
        <p className="text-gray-300 text-center mb-4 md:mb-6 text-sm md:text-base">
          {description}
        </p>

        <div className="space-y-4 relative">
          {/* Source Input */}
          <div ref={sourceRef} className="relative">
            <input
              type="text"
              placeholder="Source"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                debouncedFetchSource(e.target.value);
              }}
              className={`w-full ${currentColors.bgInput} border ${currentColors.borderInput} rounded-lg p-2 text-sm md:text-base ${currentColors.textInput} focus:outline-none focus:ring-2 focus:ring-blue-400`}
            />
            {sourceSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-auto text-black text-sm">
                {sourceSuggestions.map((s, idx) => (
                  <li
                    key={idx}
                    className="p-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() => {
                      setSource(s.name);
                      setSourceSuggestions([]);
                    }}
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Destination Input */}
          <div ref={destinationRef} className="relative">
            <input
              type="text"
              placeholder="Destination"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                debouncedFetchDestination(e.target.value);
              }}
              className={`w-full ${currentColors.bgInput} border ${currentColors.borderInput} rounded-lg p-2 text-sm md:text-base ${currentColors.textInput} focus:outline-none focus:ring-2 focus:ring-blue-400`}
            />
            {destinationSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-auto text-black text-sm">
                {destinationSuggestions.map((d, idx) => (
                  <li
                    key={idx}
                    className="p-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() => {
                      setDestination(d.name);
                      setDestinationSuggestions([]);
                    }}
                  >
                    {d.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            className={`w-full py-2 rounded-lg transition cursor-pointer active:${currentColors.activeButton} ${currentColors.button} text-sm md:text-base`}
            onClick={handleGetFare}
            disabled={loading}
          >
            {loading ? "Loading..." : "Get Fare"}
          </button>
        </div>

        {/* Info Panels */}
        {busData && busData.fare && (
          <div
            className={`mt-4 md:mt-6 p-3 md:p-4 ${currentColors.bgPanel} rounded-lg border ${currentColors.borderPanel}`}
          >
            <h2 className="font-semibold mb-1 md:mb-2 text-sm md:text-base">
              Bus fare (tk):
            </h2>
            <pre className="text-xs md:text-sm">{busData.fare}</pre>
          </div>
        )}

        {busData && busData.distance && (
          <div
            className={`mt-4 md:mt-6 p-3 md:p-4 ${currentColors.bgPanel} rounded-lg border ${currentColors.borderPanel}`}
          >
            <h2 className="font-semibold mb-1 md:mb-2 text-sm md:text-base">
              Distance (km):
            </h2>
            <pre className="text-xs md:text-sm">{busData.distance}</pre>
          </div>
        )}

        {busData && busData.travel_time && (
          <div
            className={`mt-4 md:mt-6 p-3 md:p-4 ${currentColors.bgPanel} rounded-lg border ${currentColors.borderPanel}`}
          >
            <h2 className="font-semibold mb-1 md:mb-2 text-sm md:text-base">
              Travel time (minute):
            </h2>
            <pre className="text-xs md:text-sm">{busData.travel_time}</pre>
          </div>
        )}

        {busData && busData.bus_lists && busData.bus_lists.length > 0 && (
          <div
            className={`mt-4 md:mt-6 p-3 md:p-4 ${currentColors.bgPanel} rounded-lg border ${currentColors.borderPanel}`}
          >
            <h2 className="font-semibold mb-1 md:mb-2 text-sm md:text-base">
              Bus list:
            </h2>
            <ul className="list-disc pl-5 text-xs md:text-sm">
              {busData.bus_lists.map((bus, idx) => (
                <li key={idx}>{bus}</li>
              ))}
            </ul>
          </div>
        )}

        {reqSent &&
          busData &&
          busData.bus_lists &&
          busData.bus_lists.length === 0 && (
            <div
              className={`mt-4 md:mt-6 p-3 md:p-4 ${currentColors.bgPanel} rounded-lg border ${currentColors.borderPanel}`}
            >
              Nothing found!
            </div>
          )}
      </div>

      {/* Right Panel - Map */}
      <div className="w-full md:max-w-4xl h-64 md:h-[600px] rounded-lg overflow-hidden shadow-lg">
        <MapContainer
          center={[23.8103, 90.4125]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            url={"https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}"}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {busData && busData.coordinates && busData.coordinates.length > 0 && (
            <Polyline
              positions={busData.coordinates}
              color={currentColors.polyline}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
