"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import LeafletIconFix from "./LeafletIconFix";
import L from "leaflet";


const createCustomIcon = (color: string) => {
    return L.divIcon({
        className: "bg-transparent",
        html: `
            <div class="relative flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-10 drop-shadow-md">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3" fill="white"></circle>
                </svg>
            </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
    })
};

const startIcon = createCustomIcon("#22C55E");
const endIcon = createCustomIcon("#EF4444");

export default function MapView() {
    // Location of HCM city center
    const center: [number, number] = [10.7769, 106.7009];
    const zoom = 14;

    // State to store the start and end points
    const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
    const [endPoint, setEndPoint] = useState<[number, number] | null>(null);

    // Component use to handle map click events
    const MapEventsHandler = () => {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                
                // - If no start point or (start + end points) -> Reset
                // - If already has start point but no end point -> Set end point
                if (!startPoint || (startPoint && endPoint)) {
                    setStartPoint([lat, lng]);
                    setEndPoint(null);
                } else if (!endPoint) {
                    setEndPoint([lat, lng]);
                }
            },
        });
        return null;
    };

    return (
        <div className="h-screen w-full relative z-0">
            <LeafletIconFix />
            
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-white px-6 py-3 rounded-full shadow-lg border border-gray-200 pointer-events-none transition-all">
                <p className="text-sm font-medium text-gray-700">
                    {!startPoint 
                        ? "📍 Click vào bản đồ để chọn Điểm Xuất Phát" 
                        : !endPoint 
                            ? "Click thêm lần nữa để chọn Điểm Kết Thúc" 
                            : "Đã chọn xong! (Click để chọn lại từ đầu)"}
                </p>
            </div>

            <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="h-full w-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Subscribe Event Listener */}
                <MapEventsHandler />

                {/* Render Marker Start */}
                {startPoint && (
                    <Marker position={startPoint} icon={startIcon}>
                        <Popup className="font-semibold text-green-600">Điểm Xuất Phát</Popup>
                    </Marker>
                )}

                {/* Render Marker End */}
                {endPoint && (
                    <Marker position={endPoint} icon={endIcon}>
                        <Popup className="font-semibold text-red-600">Điểm Kết Thúc</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}