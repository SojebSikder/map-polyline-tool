import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function HoverLocationPopup() {
  const map = useMap();
  const [popup, setPopup] = useState<L.Popup | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!map) return;

    const onMove = (e: L.LeafletMouseEvent) => {
      // Debounce to avoid calling API too frequently
      if (timeoutId) clearTimeout(timeoutId);

      const newTimeout = setTimeout(async () => {
        const { lat, lng } = e.latlng;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const name =
            data.display_name ||
            `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;

          // Create or update popup
          if (popup) {
            popup.setLatLng(e.latlng).setContent(`<b>${name}</b>`).openOn(map);
          } else {
            const newPopup = L.popup({ closeButton: false })
              .setLatLng(e.latlng)
              .setContent(`<b>${name}</b>`)
              .openOn(map);
            setPopup(newPopup);
          }
        } catch (err) {
          // If API fails, just show coordinates
          if (popup) {
            popup
              .setLatLng(e.latlng)
              .setContent(
                `Lat: ${e.latlng.lat.toFixed(5)}, Lng: ${e.latlng.lng.toFixed(
                  5
                )}`
              )
              .openOn(map);
          }
        }
      }, 600); // 600ms delay before calling API

      setTimeoutId(newTimeout);
    };

    const onMouseOut = () => {
      if (popup) map.closePopup(popup);
    };

    map.on("mousemove", onMove);
    map.on("mouseout", onMouseOut);

    return () => {
      map.off("mousemove", onMove);
      map.off("mouseout", onMouseOut);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [map, popup, timeoutId]);

  return null;
}
