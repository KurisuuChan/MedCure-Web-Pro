import React from "react";

export function GlobalSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading Medcure...</p>
        </div>
      </div>
    </div>
  );
}
