import { Suspense, lazy } from "react";
import { Helmet } from "react-helmet";
import Navbar from "../components/Navbar";
import BodyMain1 from "./BodyMain1";
import HeroSection from "./HeroSection";
import SimulatedTypingDemo from "./SimulatedTypingDemo";
import GifShowcase from "./GifShowCase";

// Lazy-loaded components
const Footer = lazy(() => import("../components/Footer"));
const BannerLandpage = lazy(() => import("./BannerLandPage"));

export default function LandingPage() {
  return (
    <>
  <Helmet>
  <title>LinkedIn Post Generator with AI | PostLn</title>
  <meta
    name="description"
    content="AI LinkedIn post generator for professionals. Write, rewrite, and schedule engaging LinkedIn content tailored to your tone and audience."
  />
  <link rel="canonical" href="https://www.postln.com/" />

</Helmet>


      <Navbar />
      <HeroSection />
      <SimulatedTypingDemo />
      {/* Lazy-loaded below pages */}
      <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
       <GifShowcase />
      <BodyMain1 />
        <BannerLandpage />
        <Footer />
      </Suspense>
    </>
  );
}