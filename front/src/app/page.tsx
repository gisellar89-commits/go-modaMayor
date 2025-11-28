import Image from "next/image";
import HomeCarousel from "../components/HomeCarousel";
import HomeVideos from "../components/HomeVideos";
import HomeSectionsDisplay from "../components/HomeSectionsDisplay";
import SeasonHighlight from "../components/SeasonHighlight";
import HowItWorks from "../components/HowItWorks";

export default function Home() {
  return (
    <div className="font-sans min-h-screen">
      {/* Carousel below header */}
      <HomeCarousel />

      {/* Cómo comprar - justo debajo del carousel */}
      <div className="bg-[#d5b6af]">
        <HowItWorks />
      </div>

      {/* Videos section */}
      <HomeVideos />

      {/* Season highlight */}
      <SeasonHighlight />

      {/* Secciones dinámicas del home: Nuevos Ingresos, Destacados, Ofertas, Tendencias, Más Vendidos */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HomeSectionsDisplay />
      </div>
    </div>
  );
}
