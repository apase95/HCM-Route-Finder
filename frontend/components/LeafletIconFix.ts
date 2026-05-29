"use client";

import L from "leaflet";

// Xóa icon mặc định bị lỗi đường dẫn của NextJS
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Cấu hình lại để lấy icon trực tiếp từ CDN của unpkg
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function LeafletIconFix() {
    return null;
}
