import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import CartModal from "../components/CartModal";
import WhatsAppButton from "../components/WhatsAppButton";
import PriceNotification from "../components/PriceNotification";
import AddressReminderBanner from "../components/AddressReminderBanner";
import { AuthProvider } from "../contexts/AuthContext";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Moda Mayor",
  description: "Tienda de moda al por mayor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <div className="w-full">
            <TopBar />
            <Navbar />
            <AddressReminderBanner />
          </div>
          <Toaster />
          <main className="min-h-screen w-full">
            {children}
          </main>
          <Footer />
          <CartModal />
          <WhatsAppButton />
          <PriceNotification />
        </AuthProvider>
      <script src="/debugProducts.js"></script>
      </body>
    </html>
  );
}
