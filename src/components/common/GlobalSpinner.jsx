import React from "react";
import { UnifiedSpinner } from "../ui/loading/UnifiedSpinner";

export function GlobalSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="text-center animate-scale-up">
        <UnifiedSpinner
          variant="gradient"
          size="xl"
          text="Loading MedCure..."
        />
      </div>
    </div>
  );
}
