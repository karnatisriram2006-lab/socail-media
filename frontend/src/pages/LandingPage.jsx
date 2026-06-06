import { lazy, Suspense, useState, useEffect } from "react";
import useLenis from "../hooks/useLenis";
import HeroSection from "./landing/HeroSection";
import LandingNav from "./landing/LandingNav";
import LandingFooter from "./landing/LandingFooter";
import StorySection from "./landing/StorySection";
import GradientMesh from "./landing/GradientMesh";
import BackToTop from "./landing/BackToTop";

const FeaturesSection = lazy(() => import("./landing/FeaturesSection"));
const MockFeedSection = lazy(() => import("./landing/MockFeedSection"));
const StatsSection = lazy(() => import("./landing/StatsSection"));
const WhySection = lazy(() => import("./landing/WhySection"));
const CreatorsSection = lazy(() => import("./landing/CreatorsSection"));
const TestimonialsSection = lazy(() => import("./landing/TestimonialsSection"));
const CommunitySection = lazy(() => import("./landing/CommunitySection"));
const AppSection = lazy(() => import("./landing/AppSection"));

export default function LandingPage() {
  useLenis();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <GradientMesh />
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }}
      />
      <Suspense fallback={null}>
        <LandingNav />
        <HeroSection />
        <StorySection />
        <FeaturesSection />
        <MockFeedSection />
        <StatsSection />
        <WhySection />
        <CreatorsSection />
        <TestimonialsSection />
        <CommunitySection />
        <AppSection />
        <LandingFooter />
        <BackToTop visible={scrolled} />
      </Suspense>
    </div>
  );
}