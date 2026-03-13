import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const DEFAULT_CENTER = [49.0, 31.0];

let markerIconConfigured = false;

if (!markerIconConfigured) {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
  });
  markerIconConfigured = true;
}

function toCoord(value) {
  const parsed = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      onSelect(lat, lng);
    },
  });
  return null;
}

function RecenterOnSelection({ selectedPosition }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPosition) {
      map.setView(selectedPosition, Math.max(map.getZoom(), 13), { animate: true });
    }
  }, [map, selectedPosition]);

  return null;
}

export default function LocationPickerMap({ lat, lng, onSelect }) {
  const latNum = toCoord(lat);
  const lngNum = toCoord(lng);
  const selectedPosition = useMemo(() => {
    if (latNum === null || lngNum === null) return null;
    return [latNum, lngNum];
  }, [latNum, lngNum]);
  const center = selectedPosition || DEFAULT_CENTER;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <MapContainer
        center={center}
        zoom={selectedPosition ? 13 : 6}
        scrollWheelZoom
        style={{ height: 280, width: "100%", borderRadius: 10, overflow: "hidden" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onSelect={onSelect} />
        <RecenterOnSelection selectedPosition={selectedPosition} />
        {selectedPosition ? <Marker position={selectedPosition} /> : null}
      </MapContainer>

    </div>
  );
}
