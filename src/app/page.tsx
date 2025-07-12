import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import StickyFeatureCards from '@/components/StickyFeatureCards';
import FeaturesGrid from '@/components/FeaturesGrid';
import PricingSection from '@/components/PricingSection';
import ClientReviews from '@/components/ClientReviews';
import FAQSection from '@/components/FAQSection';
import AppDownload from '@/components/AppDownload';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <StickyFeatureCards />
      <FeaturesGrid />
      <PricingSection />
      <ClientReviews />
      <FAQSection />
      <AppDownload />
      <Footer />
    </main>
  );
}
