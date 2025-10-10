"use client";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import { useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// import L, { icon } from "leaflet";

// Extend Leaflet's type definitions to include Routing
declare module "leaflet" {
  namespace Routing {
    function control(options: any): any;
    function osrmv1(options: any): any;
  }
}

export default function RouteControl({
  start,
  end,
}: {
  start: [number, number] | null;
  end: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !start || !end) return undefined;

    // Clear existing routes
    map.eachLayer((layer: any) => {
      if (layer._route) map.removeControl(layer);
    });

    const routeControl = L.Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      lineOptions: {
        styles: [{ color: "blue", weight: 5 }],
      },
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
      showAlternatives: false,
      addWaypoints: false,
      routeWhileDragging: false,
      show: true,
      createMarker: (i: any, wp: any) => {
        if (i === 0) {
          // Start marker (default blue)
          return L.marker(wp.latLng);
        } else {
          // End marker (red)
          const redIcon = new L.Icon({
            iconUrl:
              "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
            shadowUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });
          return L.marker(wp.latLng, { icon: redIcon });
        }
      },
    }).addTo(map);

    // Hide the itinerary panel via CSS
    const container = routeControl.getContainer();
    if (container) container.style.display = "none";

    return () => {
      map.removeControl(routeControl);
    };
  }, [map, start, end]);

  return null;
}
