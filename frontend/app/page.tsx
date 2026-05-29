"use client";

import dynamic from "next/dynamic";

// Import MapView dưới dạng Dynamic Component, vô hiệu hóa SSR (Server-Side Rendering)
const MapView = dynamic(() => import("@/components/MapView"), {
    ssr: false,
    loading: () => (
        <div className="flex h-screen w-full items-center justify-center bg-gray-100">
            <p className="text-lg font-medium text-gray-600">Đang tải bản đồ...</p>
        </div>
    ),
});

export default function Home() {
    return (
        <main className="h-screen w-full">
            <MapView />
        </main>
    );
}