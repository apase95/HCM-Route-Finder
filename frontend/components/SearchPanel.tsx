"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, Loader2, Car, Bike, Footprints, AlertTriangle, Plus, X } from "lucide-react";

export interface Waypoint {
    id: string;
    text: string;
    lat: number | null;
    lng: number | null;
}

interface SearchInputProps {
    placeholder: string;
    icon: React.ReactNode;
    value: string;
    onChangeText: (val: string) => void;
    onSelect: (lat: number, lng: number, name: string) => void;
}

function SearchInput({ placeholder, icon, value, onChangeText, onSelect }: SearchInputProps) {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (value.trim().length < 2 || value.includes("📍")) {
            setResults([]); return;
        }
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8080/api/v1/search?q=${encodeURIComponent(value)}`);
                const json = await res.json();
                if (json.success) setResults(json.data || []);
            } catch (error) { console.error(error); } 
            finally { setLoading(false); }
        }, 500);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className="relative w-full">
            <div className="flex items-center bg-gray-50 rounded-lg p-2 border border-gray-200 focus-within:border-blue-500 focus-within:bg-white transition-colors shadow-sm">
                <div className="text-gray-500 mr-2">{icon}</div>
                <input
                    type="text" className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 font-medium"
                    placeholder={placeholder} value={value}
                    onChange={(e) => { onChangeText(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
                />
                {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
            </div>

            {showDropdown && results?.length > 0 && (
                <ul className="absolute z-50 w-full bg-white mt-1 rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                    {results.map((r, i) => (
                        <li key={i} className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0"
                            onClick={() => { setShowDropdown(false); onSelect(r.lat, r.lng, r.name.split(',')[0]); }}>
                            <p className="font-medium text-gray-800 line-clamp-1">{r.name.split(',')[0]}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{r.name}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

interface Props {
    waypoints: Waypoint[];
    setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>;
    vehicle: string; setVehicle: (val: string) => void;
    onFindRoute: () => void;
    isLoading: boolean;
    avoidTraffic: boolean; setAvoidTraffic: (val: boolean) => void;
    hour: number; setHour: (h: number) => void;
}

export default function SearchPanel({ waypoints, setWaypoints, vehicle, setVehicle, onFindRoute, isLoading, avoidTraffic, setAvoidTraffic, hour, setHour }: Props) {
    
    const addWaypoint = () => {
        if (waypoints.length >= 5) return alert("Chỉ hỗ trợ tối đa 5 điểm dừng!");
        setWaypoints([...waypoints, { id: Date.now().toString(), text: '', lat: null, lng: null }]);
    };

    const removeWaypoint = (id: string) => {
        if (waypoints.length <= 2) return;
        setWaypoints(waypoints.filter(w => w.id !== id));
    };

    const updateWaypointText = (id: string, text: string) => {
        setWaypoints(waypoints.map(w => w.id === id ? { ...w, text } : w));
    };

    const updateWaypointLocation = (id: string, lat: number, lng: number, name: string) => {
        setWaypoints(waypoints.map(w => w.id === id ? { ...w, lat, lng, text: name } : w));
    };

    return (
        <div className="absolute top-4 left-4 right-4 sm:right-auto sm:w-80 sm:top-6 sm:left-6 z-[1000] bg-white p-4 sm:p-5 rounded-2xl shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
                <span>📍 Định tuyến</span>
                <button onClick={addWaypoint} title="Thêm điểm dừng" className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-1.5 rounded-md transition-colors"><Plus size={18}/></button>
            </h2>
            
            {/* DANH SÁCH ĐIỂM DỪNG */}
            <div className="space-y-3 mb-4">
                {waypoints.map((wp, index) => (
                    <div key={wp.id} className="flex items-center gap-2">
                        <div className="flex-1">
                            <SearchInput 
                                placeholder={index === 0 ? "Điểm xuất phát..." : index === waypoints.length - 1 ? "Điểm đến cuối..." : `Điểm dừng ${index}`} 
                                icon={index === 0 ? <Navigation className="w-5 h-5 text-green-500" /> : index === waypoints.length - 1 ? <MapPin className="w-5 h-5 text-red-500" /> : <MapPin className="w-5 h-5 text-orange-400" />} 
                                value={wp.text} 
                                onChangeText={(val) => updateWaypointText(wp.id, val)} 
                                onSelect={(lat, lng, name) => updateWaypointLocation(wp.id, lat, lng, name)} 
                            />
                        </div>
                        {waypoints.length > 2 && (
                            <button onClick={() => removeWaypoint(wp.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"><X size={18}/></button>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex bg-gray-100 p-1 rounded-lg mb-3">
                <button onClick={() => setVehicle("car")} className={`flex-1 py-1.5 flex justify-center items-center rounded-md text-sm font-medium transition-colors ${vehicle === "car" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"} cursor-pointer`}><Car className="w-4 h-4 mr-1.5" /> Ô tô</button>
                <button onClick={() => setVehicle("bike")} className={`flex-1 py-1.5 flex justify-center items-center rounded-md text-sm font-medium transition-colors ${vehicle === "bike" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"} cursor-pointer`}><Bike className="w-4 h-4 mr-1.5" /> Xe máy</button>
                <button onClick={() => setVehicle("foot")} className={`flex-1 py-1.5 flex justify-center items-center rounded-md text-sm font-medium transition-colors ${vehicle === "foot" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"} cursor-pointer`}><Footprints className="w-4 h-4 mr-1.5" /> Đi bộ</button>
            </div>

            <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label className="text-sm font-medium text-gray-700 flex justify-between mb-1">
                    <span>⏰ Mô phỏng Giờ:</span><span className="font-bold text-blue-600">{hour}:00</span>
                </label>
                <input type="range" min="0" max="23" value={hour} onChange={(e) => setHour(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" />
            </div>

            <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg mb-4 border border-orange-100 cursor-pointer" onClick={() => setAvoidTraffic(!avoidTraffic)}>
                <div className="flex items-center text-orange-700"><AlertTriangle className="w-5 h-5 mr-2" /><span className="text-sm font-medium">Tránh kẹt xe</span></div>
                <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${avoidTraffic ? 'bg-orange-500' : 'bg-gray-300'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${avoidTraffic ? 'translate-x-4' : ''}`}></div></div>
            </div>

            <button onClick={onFindRoute} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-md cursor-pointer flex items-center justify-center">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tìm Lộ Trình"}
            </button>
        </div>
    );
}