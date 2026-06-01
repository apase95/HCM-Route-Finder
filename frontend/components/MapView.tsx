"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from "react-leaflet";
import LeafletIconFix from "./LeafletIconFix";
import SearchPanel from "./SearchPanel";
import L from "leaflet";
import { X } from "lucide-react";

const createCustomIcon = (color: string) => {
    return L.divIcon({
        className: "bg-transparent",
        html: `
            <div class="relative flex items-center justify-center w-8 h-10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-10 drop-shadow-md">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3" fill="white"></circle>
                </svg>
            </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
    });
};

const startIcon = createCustomIcon("#22C55E");
const endIcon = createCustomIcon("#EF4444");

const MapController = ({ center }: { center: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 15, { animate: true, duration: 1.5 });
        }
    }, [center, map]);
    return null;
};

const RouteFitter = ({ path }: { path: [number, number][] }) => {
    const map = useMap();
    useEffect(() => {
        if (path.length > 0) {
            map.fitBounds(path, { padding: [50, 50] });
        }
    }, [path, map]);
    return null;
};

const MapEventsHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

export default function MapView() {
    const center: [number, number] = [10.7769, 106.7009];
    const zoom = 14;

    const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
    const [endPoint, setEndPoint] = useState<[number, number] | null>(null);
    const [startText, setStartText] = useState("");
    const [endText, setEndText] = useState("");
    const [lastActivePoint, setLastActivePoint] = useState<[number, number] | null>(null);
    
    const [routePath, setRoutePath] = useState<[number, number][]>([]);
    const [isRouting, setIsRouting] = useState(false);
    
    // THÊM MỚI: State lưu thông tin quãng đường và thời gian
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

    const handleMapClick = (lat: number, lng: number) => {
        if (!startPoint || (startPoint && endPoint)) {
            setStartPoint([lat, lng]);
            setEndPoint(null);
            setRoutePath([]);
            setRouteInfo(null);
        } else if (!endPoint) {
            setEndPoint([lat, lng]);
        }
    };

    const fetchRoute = async (start: [number, number], end: [number, number]) => {
        setIsRouting(true);
        try {
            const res = await fetch(`http://localhost:8080/api/v1/routes?startLat=${start[0]}&startLng=${start[1]}&endLat=${end[0]}&endLng=${end[1]}`);
            const data = await res.json();
            
            if (data.success) {
                setRoutePath(data.data.path);
                // THÊM MỚI: Lưu thông tin quãng đường & thời gian
                setRouteInfo({
                    distance: data.data.distance,
                    duration: data.data.duration
                });
            } else {
                alert("Lỗi: " + data.message);
            }
        } catch (error) {
            alert("Lỗi kết nối đến server tìm đường.");
        } finally {
            setIsRouting(false);
        }
    };

    const handleFindRoute = () => {
        if (!endPoint) {
            alert("Vui lòng chọn hoặc nhập Điểm Đến trước khi tìm đường!");
            return;
        }

        if (!startPoint) {
            if ("geolocation" in navigator) {
                setIsRouting(true);
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const currentLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
                        setStartPoint(currentLoc);
                        setLastActivePoint(currentLoc);
                        setStartText("Vị trí hiện tại của bạn");
                        fetchRoute(currentLoc, endPoint);
                    },
                    (error) => {
                        setIsRouting(false);
                        alert("Trình duyệt không thể lấy vị trí hiện tại của bạn. Vui lòng tự chọn điểm xuất phát!");
                    },
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            } else {
                alert("Trình duyệt của bạn không hỗ trợ định vị.");
            }
        } else {
            fetchRoute(startPoint, endPoint);
        }
    };

    // Hàm format khoảng cách cho đẹp mắt
    const formatDistance = (meters: number) => {
        if (meters >= 1000) {
            return (meters / 1000).toFixed(1) + " km";
        }
        return Math.round(meters) + " mét";
    };

    // Hàm Reset toàn bộ trạng thái
    const handleClearRoute = () => {
        setStartPoint(null);
        setEndPoint(null);
        setStartText("");
        setEndText(""); 
        setRoutePath([]);
        setRouteInfo(null);
        setLastActivePoint(center);
    };

    return (
        <div className="h-screen w-full relative z-0">
            <LeafletIconFix />
            
            <SearchPanel 
                startText={startText}
                endText={endText}
                setStartText={setStartText}
                setEndText={setEndText}
                onSelectStart={(lat, lng) => {
                    
                    setStartPoint([lat, lng]);
                    setLastActivePoint([lat, lng]);
                    setRoutePath([]);
                    setRouteInfo(null);
                }}
                onSelectEnd={(lat, lng) => {
                    setEndPoint([lat, lng]);
                    setLastActivePoint([lat, lng]);
                }}
                onFindRoute={handleFindRoute}
                isLoading={isRouting}
            />

            {routeInfo && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-white px-6 py-4 rounded-2xl shadow-2xl border border-gray-200 flex items-center space-x-6 transition-all animate-in slide-in-from-bottom-5">
                    <div className="flex flex-col items-center">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Quãng đường</p>
                        <p className="text-2xl font-black text-blue-600">
                            {formatDistance(routeInfo.distance)}
                        </p>
                    </div>
                    
                    <div className="h-10 w-px bg-gray-200"></div>
                    
                    <div className="flex flex-col items-center">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Thời gian (Ô tô)</p>
                        <p className="text-2xl font-black text-green-600">
                            {Math.ceil(routeInfo.duration / 60)} <span className="text-lg">phút</span>
                        </p>
                    </div>

                    <button
                        onClick={handleClearRoute}
                        className="ml-4 bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-500 p-3 rounded-full transition-colors duration-200"
                        title="Xóa tuyến đường"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="h-full w-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MapEventsHandler onMapClick={handleMapClick} />
                <MapController center={lastActivePoint} />
                <RouteFitter path={routePath} />

                {startPoint && (
                    <Marker position={startPoint} icon={startIcon}>
                        <Popup className="font-semibold text-green-600">Điểm Xuất Phát</Popup>
                    </Marker>
                )}

                {endPoint && (
                    <Marker position={endPoint} icon={endIcon}>
                        <Popup className="font-semibold text-red-600">Điểm Kết Thúc</Popup>
                    </Marker>
                )}

                {routePath.length > 0 && (
                    <Polyline 
                        positions={routePath} 
                        color="#2563eb" 
                        weight={5} 
                        opacity={0.8}
                        lineCap="round"
                        lineJoin="round"
                    />
                )}
            </MapContainer>
        </div>
    );
}