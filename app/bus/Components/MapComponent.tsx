"use client";

import { showToast } from "@/helper/toast";
import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE_URL = "http://localhost:8080";

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
  const [busList, setBusList] = useState<string[]>([]);
  const [fare, setFare] = useState<number | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const [sourceSuggestions, setSourceSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>(
    []
  );

  const sourceRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [reqSent, setReqSent] = useState(false);

  // Debounce helper
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
        setCoordinates([]);
        setFare(null);
        setBusList([]);
        return;
      }

      setCoordinates(coords);
      setFare(data.data.fare);
      setBusList(data.data.bus);
      showToast("Route loaded successfully!", "success");

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
      className={`${currentColors.bgPage} min-h-screen flex items-center justify-center p-6`}
    >
      <div
        className={`${currentColors.bgCard} shadow-lg rounded-lg p-8 w-full max-w-lg mb-6 mr-4 ${currentColors.textCard}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h1
            className={`text-3xl font-bold text-center ${currentColors.title}`}
          >
            {title}
          </h1>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="ml-4 px-3 py-1 rounded-lg border border-gray-400 text-sm"
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
        <p className="text-gray-300 text-center mb-6">{description}</p>

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
              className={`w-full ${currentColors.bgInput} border ${currentColors.borderInput} rounded-lg p-2 ${currentColors.textInput} focus:outline-none focus:ring-2 focus:ring-blue-400`}
            />
            {sourceSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-auto text-black">
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
              className={`w-full ${currentColors.bgInput} border ${currentColors.borderInput} rounded-lg p-2 ${currentColors.textInput} focus:outline-none focus:ring-2 focus:ring-blue-400`}
            />
            {destinationSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-auto text-black">
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
            className={`w-full py-2 rounded-lg transition cursor-pointer active:${currentColors.activeButton} ${currentColors.button}`}
            onClick={handleGetFare}
          >
            Get Fare
          </button>
        </div>

        {fare && (
          <div
            className={`mt-6 p-4 ${currentColors.bgPanel} rounded-lg border ${currentColors.borderPanel}`}
          >
            <h2 className="font-semibold mb-2">Bus fare:</h2>
            <pre className="text-sm">{fare}</pre>
          </div>
        )}

        {busList.length > 0 && (
          <div
            className={`mt-6 p-4 ${currentColors.bgPanel} rounded-lg border ${currentColors.borderPanel}`}
          >
            <h2 className="font-semibold mb-2">Bus list:</h2>
            <ul className="list-disc pl-5">
              {busList.map((bus, idx) => (
                <li key={idx} className="text-sm">
                  {bus}
                </li>
              ))}
            </ul>
          </div>
        )}

        {reqSent && busList.length == 0 && (
          <div
            className={`mt-6 p-4 ${currentColors.bgPanel} rounded-lg border ${currentColors.borderPanel}`}
          >
            Nothing found!
          </div>
        )}
      </div>

      <div className="w-full max-w-4xl h-[600px] rounded-lg overflow-hidden shadow-lg">
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
          {coordinates.length > 0 && (
            <Polyline positions={coordinates} color={currentColors.polyline} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
