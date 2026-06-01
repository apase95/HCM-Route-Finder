"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";

interface SearchResult {
    name: string;
    lat: number;
    lng: number;
}

interface SearchInputProps {
    placeholder: string;
    icon: React.ReactNode;
    value: string;
    onChangeText: (val: string) => void;
    onSelect: (lat: number, lng: number, name: string) => void;
}

function SearchInput({ placeholder, icon, value, onChangeText, onSelect }: SearchInputProps) {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (value.trim().length < 2 || value.includes("📍")) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8080/api/v1/search?q=${encodeURIComponent(value)}`);
                const json = await res.json();
                if (json.success) {
                    setResults(json.data || []);
                }
            } catch (error) {
                console.error("Lỗi tìm kiếm:", error);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className="relative w-full mb-3">
            <div className="flex items-center bg-gray-50 rounded-lg p-2 border border-gray-200 focus-within:border-blue-500 focus-within:bg-white transition-colors shadow-sm">
                <div className="text-gray-500 mr-2">{icon}</div>
                <input
                    type="text"
                    className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 font-medium"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        onChangeText(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
                />
                {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
            </div>

            {showDropdown && results?.length > 0 && (
                <ul className="absolute z-50 w-full bg-white mt-1 rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                    {results.map((r, i) => (
                        <li
                            key={i}
                            className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0"
                            onClick={() => {
                                const shortName = r.name.split(',')[0];
                                setShowDropdown(false);
                                onSelect(r.lat, r.lng, shortName);
                            }}
                        >
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
    startText: string;
    endText: string;
    setStartText: (text: string) => void;
    setEndText: (text: string) => void;
    onSelectStart: (lat: number, lng: number) => void;
    onSelectEnd: (lat: number, lng: number) => void;
    onFindRoute: () => void;
    isLoading: boolean;
}

export default function SearchPanel({ 
    startText, endText, setStartText, setEndText, 
    onSelectStart, onSelectEnd, onFindRoute, isLoading 
}: Props) {
    return (
        <div className="absolute top-6 left-6 z-[1000] w-80 bg-white p-5 rounded-2xl shadow-xl border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📍 Tìm đường đi</h2>
            
            <SearchInput
                placeholder="Tìm điểm xuất phát..."
                icon={<Navigation className="w-5 h-5 text-green-500" />}
                value={startText}
                onChangeText={setStartText}
                onSelect={(lat, lng, name) => {
                    setStartText(name);
                    onSelectStart(lat, lng);
                }}
            />
            
            <SearchInput
                placeholder="Tìm điểm đến..."
                icon={<MapPin className="w-5 h-5 text-red-500" />}
                value={endText}
                onChangeText={setEndText}
                onSelect={(lat, lng, name) => {
                    setEndText(name);
                    onSelectEnd(lat, lng);
                }}
            />

            <button 
                onClick={onFindRoute}
                disabled={isLoading}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-md cursor-pointer flex items-center justify-center"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tìm Đường"}
            </button>
        </div>
    );
}