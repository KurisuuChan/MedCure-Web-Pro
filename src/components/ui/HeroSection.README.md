HeroSection component

Usage

Import:

import HeroSection from '../components/ui/HeroSection'

Props

- title: string | JSX - main headline
- subtitle: string | JSX - short descriptive text
- features: array - each item: { icon: JSX, title: string, description: string }
- primaryCta: { label, href?, onClick? }
- secondaryCta: { label, href?, onClick? }
- illustration: optional JSX (svg or image)

Example

<HeroSection
title={<span>MedCure Pro — Pharmacy inventory made modern</span>}
subtitle={"A focused, professional inventory and POS system tailored for pharmacies."}
features={[{ icon: <Package/>, title: 'Inventory-first', description: 'Accurate stock tracking.' }]}
primaryCta={{ label: 'Get started', href: '/inventory' }}
secondaryCta={{ label: 'Learn more', href: '#features' }}
/>

Integration Notes

- Tailwind is used for styling; ensure your project includes Tailwind or adapt classes to your CSS system.
- The component is intentionally neutral in color to match the existing theme. Adjust class names for colors if your design tokens differ.
- For server-side rendering, supply `illustration` as an inline SVG or an <img> with a valid src.
