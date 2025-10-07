import React from "react";
import HeroSection from "../components/ui/HeroSection";
import { Package, Box, Layers } from "lucide-react";

export default function HeroLanding() {
  const features = [
    {
      icon: <Package className="h-4 w-4" />,
      title: "Inventory-first",
      description: "Accurate stock tracking with batch-level control.",
    },
    {
      icon: <Layers className="h-4 w-4" />,
      title: "Flexible packaging",
      description: "Support bottles, sachets, boxes and custom units.",
    },
    {
      icon: <Box className="h-4 w-4" />,
      title: "Sales-ready",
      description: "Smooth POS integration and reliable analytics.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection
        title={<span>MedCure Pro — Pharmacy inventory made modern</span>}
        subtitle={
          <>
            A focused, professional inventory and POS system tailored for
            pharmacies. Manage batches, packaging, and reports with clarity —
            without the clutter.
          </>
        }
        features={features}
        primaryCta={{ label: "Get started", href: "/inventory" }}
        secondaryCta={{ label: "Learn more", href: "/learn-more" }}
        illustration={"/Preview.png"}
      />

      <div
        id="features"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Why MedCure Pro?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold mb-2">Batch-aware inventory</h4>
            <p className="text-sm text-gray-600">
              Track expiry and batches per purchase. Never sell expired stock.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold mb-2">Flexible units</h4>
            <p className="text-sm text-gray-600">
              Configure bottles, sachets, sheets or custom units per product.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold mb-2">Built for pharmacies</h4>
            <p className="text-sm text-gray-600">
              Domain-specific UX patterns for speed and accuracy at the counter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
