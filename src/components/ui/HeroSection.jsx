import React from "react";

// A modern, minimal hero section designed to fit the project's Tailwind-based UI
// Props:
// - title: string or JSX
// - subtitle: string or JSX
// - features: array of {icon: JSX, title: string, description: string}
// - primaryCta: {label, onClick or href}
// - secondaryCta: {label, onClick or href}
// - illustration: optional JSX (svg/image)

export default function HeroSection({
  title,
  subtitle,
  features = [],
  primaryCta,
  secondaryCta,
  illustration,
}) {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-16 lg:py-24">
          {/* Left: Text */}
          <div className="lg:col-span-7">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-4 text-gray-600 max-w-2xl text-lg">{subtitle}</p>
            )}

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              {primaryCta &&
                (primaryCta.href ? (
                  <a
                    href={primaryCta.href}
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                  >
                    {primaryCta.label}
                  </a>
                ) : (
                  <button
                    onClick={primaryCta.onClick}
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                  >
                    {primaryCta.label}
                  </button>
                ))}

              {secondaryCta &&
                (secondaryCta.href ? (
                  <a
                    href={secondaryCta.href}
                    className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {secondaryCta.label}
                  </a>
                ) : (
                  <button
                    onClick={secondaryCta.onClick}
                    className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {secondaryCta.label}
                  </button>
                ))}
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      {f.icon || (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {f.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {f.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Illustration */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              {illustration ? (
                typeof illustration === "string" ? (
                  <div className="rounded-lg overflow-hidden shadow-md bg-gray-50 p-6">
                    <img
                      src={illustration}
                      alt="Hero illustration"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden shadow-md bg-gray-50 p-6">
                    {illustration}
                  </div>
                )
              ) : (
                <div className="rounded-lg overflow-hidden shadow-md bg-gradient-to-tr from-white to-gray-50 p-6 flex items-center justify-center">
                  {/* Subtle illustrative SVG */}
                  <svg
                    width="320"
                    height="220"
                    viewBox="0 0 320 220"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="8"
                      y="20"
                      width="280"
                      height="160"
                      rx="12"
                      fill="#F8FAFC"
                      stroke="#E6EEF7"
                    />
                    <rect
                      x="28"
                      y="40"
                      width="110"
                      height="18"
                      rx="6"
                      fill="#E6F0FF"
                    />
                    <rect
                      x="28"
                      y="70"
                      width="220"
                      height="14"
                      rx="6"
                      fill="#EEF6FF"
                    />
                    <rect
                      x="28"
                      y="94"
                      width="180"
                      height="12"
                      rx="6"
                      fill="#F2F8FF"
                    />
                    <circle cx="220" cy="140" r="28" fill="#E6F0FF" />
                    <path
                      d="M200 140c10-22 34-22 44 0"
                      stroke="#D0E8FF"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
