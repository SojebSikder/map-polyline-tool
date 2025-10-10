"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { OpenStreetMapProvider } from "leaflet-geosearch";

type Props = {
  placeholder?: string;
  onSelect: (coords: [number, number], label: string) => void;
};

export type LocationSearchInputRef = {
  reset: () => void;
};

const LocationSearchInput = forwardRef<LocationSearchInputRef, Props>(
  ({ placeholder, onSelect }, ref) => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const provider = new OpenStreetMapProvider();
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // expose reset function to parent
    useImperativeHandle(ref, () => ({
      reset() {
        setQuery("");
        setSuggestions([]);
      },
    }));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.length < 3) {
        setSuggestions([]);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        try {
          const results = await provider.search({ query: value });
          setSuggestions(results);
        } catch (err) {
          console.error(err);
          setSuggestions([]);
        }
      }, 400);
    };

    const handleSelect = (item: any) => {
      const coords: [number, number] = [item.y, item.x]; // latitude, longitude
      onSelect(coords, item.label);
      setQuery(item.label);
      setSuggestions([]);
    };

    return (
      <div className="relative w-full">
        <input
          type="text"
          className="w-full p-2 border rounded"
          placeholder={placeholder || "Search location..."}
          value={query}
          onChange={handleChange}
        />

        {suggestions.length > 0 && (
          <ul className="absolute z-50 w-full bg-white border rounded mt-1 max-h-40 overflow-y-auto shadow-lg">
            {suggestions.map((item, i) => (
              <li
                key={i}
                className="p-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => handleSelect(item)}
              >
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

export default LocationSearchInput;
