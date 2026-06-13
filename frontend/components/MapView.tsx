"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from "react-leaflet";
import LeafletIconFix from "./LeafletIconFix";
import SearchPanel, { Waypoint } from "./SearchPanel";
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
        iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -40],
    });
};

const startIcon = createCustomIcon("#22C55E"); // Xanh
const endIcon = createCustomIcon("#EF4444");   // Đỏ
const midIcon = createCustomIcon("#F59E0B");   // Cam (Dành cho điểm trung gian)

const MapController = ({ center }: { center: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => { if (center) map.flyTo(center, 15, { animate: true, duration: 1.5 }); }, [center, map]);
    return null;
};

const RouteFitter = ({ segments }: { segments: {color: string, path: [number, number][]}[] }) => {
    const map = useMap();
    useEffect(() => {
        if (segments.length > 0) {
            const allCoords = segments.flatMap(s => s.path);
            map.fitBounds(allCoords, { padding: [50, 50] });
        }
    }, [segments, map]);
    return null;
};

const MapEventsHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
    useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
    return null;
};

export default function MapView() {
    const center: [number, number] = [10.7769, 106.7009];
    
    // Mảng lưu trữ các điểm dừng
    const [waypoints, setWaypoints] = useState<Waypoint[]>([
        { id: 'start', text: '', lat: null, lng: null },
        { id: 'end', text: '', lat: null, lng: null }
    ]);
    
    const [lastActivePoint, setLastActivePoint] = useState<[number, number] | null>(null);
    const [isRouting, setIsRouting] = useState(false);
    const [vehicle, setVehicle] = useState("car");
    const [activeVehicle, setActiveVehicle] = useState("car");
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
    const [routeSegments, setRouteSegments] = useState<{color: string, path: [number, number][]}[]>([]);
    const [avoidTraffic, setAvoidTraffic] = useState(false);
    const [hour, setHour] = useState<number>(new Date().getHours());

    // Xử lý Click bản đồ: Tự động điền vào ô còn trống đầu tiên
    const handleMapClick = (lat: number, lng: number) => {
        setRouteSegments([]); setRouteInfo(null);
        const newWaypoints = [...waypoints];
        const emptyIndex = newWaypoints.findIndex(wp => wp.lat === null);
        
        if (emptyIndex !== -1) {
            newWaypoints[emptyIndex] = { ...newWaypoints[emptyIndex], lat, lng, text: "📍 Đã chọn trên bản đồ" };
            setWaypoints(newWaypoints);
        } else {
            // Nếu đã đầy, ghi đè điểm cuối cùng
            const lastIdx = newWaypoints.length - 1;
            newWaypoints[lastIdx] = { ...newWaypoints[lastIdx], lat, lng, text: "📍 Đã chọn trên bản đồ" };
            setWaypoints(newWaypoints);
        }
    };

    const fetchRoute = async (pointsToRoute: Waypoint[]) => {
        setIsRouting(true);
        try {
            // Nối chuỗi param waypoints
            const wpParam = pointsToRoute.map(wp => `${wp.lat},${wp.lng}`).join("|");
            const res = await fetch(`http://localhost:8080/api/v1/routes?waypoints=${wpParam}&vehicle=${vehicle}&avoidTraffic=${avoidTraffic}&hour=${hour}`);
            const data = await res.json();
            
            if (data.success) {
                setRouteSegments(data.data.segments);
                setRouteInfo({ distance: data.data.distance, duration: data.data.duration });
                setActiveVehicle(vehicle);
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
        // Kiểm tra xem có đủ ít nhất 2 điểm hợp lệ (có lat, lng) không
        const validPoints = waypoints.filter(wp => wp.lat !== null && wp.lng !== null);
        
        if (validPoints.length >= 2) {
            fetchRoute(validPoints);
            return;
        }

        // Nếu thiếu điểm xuất phát -> Xin Geolocation
        if (waypoints[0].lat === null) {
            if ("geolocation" in navigator) {
                setIsRouting(true);
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const newWps = [...waypoints];
                        newWps[0] = { ...newWps[0], lat: position.coords.latitude, lng: position.coords.longitude, text: "📍 Vị trí hiện tại của bạn" };
                        setWaypoints(newWps);
                        setLastActivePoint([position.coords.latitude, position.coords.longitude]);
                        
                        const validNow = newWps.filter(wp => wp.lat !== null && wp.lng !== null);
                        if (validNow.length >= 2) fetchRoute(validNow);
                        else { setIsRouting(false); alert("Vui lòng chọn Điểm Đến!"); }
                    },
                    (error) => { setIsRouting(false); alert("Không thể lấy định vị!"); },
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            } else alert("Trình duyệt không hỗ trợ định vị.");
        } else {
            alert("Vui lòng điền ít nhất Điểm Đi và Điểm Đến!");
        }
    };

    const handleClearRoute = () => {
        setWaypoints([{ id: 'start', text: '', lat: null, lng: null }, { id: 'end', text: '', lat: null, lng: null }]);
        setRouteSegments([]); setRouteInfo(null); setLastActivePoint(center);
    };

    return (
        <div className="h-screen w-full relative z-0">
            <LeafletIconFix />
            <SearchPanel 
                waypoints={waypoints} setWaypoints={setWaypoints}
                vehicle={vehicle} setVehicle={setVehicle}
                onFindRoute={handleFindRoute} isLoading={isRouting}
                avoidTraffic={avoidTraffic} setAvoidTraffic={setAvoidTraffic}
                hour={hour} setHour={setHour}
            />

            {routeInfo && (
                <div className="absolute bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[1000] bg-white px-4 py-3 sm:px-6 sm:py-4 rounded-2xl shadow-2xl border border-gray-200 flex items-center justify-between sm:justify-center sm:space-x-6 transition-all animate-in slide-in-from-bottom-5">
                    <div className="flex flex-col items-center">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Quãng đường</p>
                        <p className="text-2xl font-black text-blue-600">{routeInfo.distance >= 1000 ? (routeInfo.distance / 1000).toFixed(1) + " km" : Math.round(routeInfo.distance) + " m"}</p>
                    </div>
                    <div className="h-10 w-px bg-gray-200"></div>
                    <div className="flex flex-col items-center">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Thời gian ({activeVehicle === 'car' ? 'Ô tô' : activeVehicle === 'bike' ? 'Xe máy' : 'Đi bộ'})</p>
                        <p className="text-2xl font-black text-green-600">{Math.ceil(routeInfo.duration / 60)} <span className="text-lg">phút</span></p>
                    </div>
                    <button onClick={handleClearRoute} className="ml-4 bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-500 p-3 rounded-full transition-colors duration-200"><X className="w-5 h-5" /></button>
                </div>
            )}

            <MapContainer center={center} zoom={14} scrollWheelZoom={true} className="h-full w-full">
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapEventsHandler onMapClick={handleMapClick} />
                <MapController center={lastActivePoint} />
                <RouteFitter segments={routeSegments} />

                {/* VẼ CÁC MARKER THEO THỨ TỰ */}
                {waypoints.map((wp, idx) => {
                    if (wp.lat === null || wp.lng === null) return null;
                    let icon = midIcon; let label = `Trạm dừng ${idx}`;
                    if (idx === 0) { icon = startIcon; label = "Điểm Xuất Phát"; }
                    else if (idx === waypoints.length - 1) { icon = endIcon; label = "Điểm Kết Thúc"; }
                    
                    return (
                        <Marker key={wp.id} position={[wp.lat, wp.lng]} icon={icon}>
                            <Popup className="font-semibold">{label}</Popup>
                        </Marker>
                    );
                })}

                {routeSegments.map((segment, idx) => (
                    <Polyline key={idx} positions={segment.path} color={segment.color === 'red' ? '#ef4444' : segment.color === 'yellow' ? '#f59e0b' : '#22c55e'} weight={6} opacity={0.9} lineCap="round" lineJoin="round" />
                ))}
            </MapContainer>
        </div>
    );
}