import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import ToastProvider from "@/components/toast-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bike Rental",
  description: "Bike Rental",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function UnauthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col ">
      {children}
      <ToastProvider />
    </div>
  );
}
