"use client";

import { useEffect } from "react";
import {
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { OpenStreetMapProvider, GeoSearchControl } from "leaflet-geosearch";
import L from "leaflet";
import "leaflet-geosearch/dist/geosearch.css";

// Component to add search control
export default function SearchControl() {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = GeoSearchControl({
      provider,
      style: "bar",
      showMarker: true,
      showPopup: true,
      marker: {
        icon: new L.Icon.Default(),
        draggable: false,
      },
      popupFormat: ({ result }: { result: { label: string } }) => result.label,
      maxMarkers: 1,
      retainZoomLevel: false,
      animateZoom: true,
    });

    map.addControl(searchControl);

    return () => {
      map.removeControl(searchControl);
    };
  }, [map]);

  return null;
}
