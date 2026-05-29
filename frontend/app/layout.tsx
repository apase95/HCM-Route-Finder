import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
    title: "HCM Route Finder",
    description: "Bản đồ tìm đường đi ngắn nhất khu vực nội thành TP.HCM",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body className={inter.className}>{children}</body>
        </html>
    );
}
