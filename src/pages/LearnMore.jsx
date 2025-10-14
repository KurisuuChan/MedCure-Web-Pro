import React from "react";
import {
  Package,
  Box,
  Layers,
  FileText,
  Upload,
  Calendar,
  Shield,
} from "lucide-react";

export default function LearnMore() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Learn more about MedCure Pro
          </h1>
          <p className="mt-4 text-gray-600 max-w-3xl">
            A short tour of the key features, how packaging works, CSV import
            guidance, and integration notes to get you up and running quickly.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <article className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold">Inventory & Batch</h3>
            </div>
            <p className="text-sm text-gray-600">
              Track stock at batch level, manage expiry dates, and keep
              inventory accurate across outlets. Automated batch numbers are
              generated and stored with each incoming batch.
            </p>
          </article>

          <article className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Layers className="w-6 h-6 text-teal-600" />
              <h3 className="text-lg font-semibold">Flexible Packaging</h3>
            </div>
            <p className="text-sm text-gray-600">
              Configure bottles, sachets, sheets, boxes or custom packaging per
              product. The system stores a packaging configuration (JSON) per
              product and converts between sale units and base stock units.
            </p>
          </article>

          <article className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-semibold">Sales & Reporting</h3>
            </div>
            <p className="text-sm text-gray-600">
              Detailed sales analytics with cost and profit calculation, and the
              ability to trace sales back to batches and stock movements.
            </p>
          </article>
        </section>

        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Packaging & Unit Model</h2>
          <p className="text-sm text-gray-700 mb-3">
            Each product can define an array of packaging units with a
            multiplier describing how many base units they contain. This allows
            selling in bottles (ml), boxes, packs and single pieces while
            keeping inventory consistent in a single base unit.
          </p>

          <div className="bg-gray-50 border border-gray-100 rounded p-4">
            <pre className="text-xs text-gray-700 overflow-auto p-2">
              {`{
  "type": "bottle",
  "units": [
    { "name": "ml", "label": "Milliliter", "multiplier": 1 },
    { "name": "bottle_60ml", "label": "60ml Bottle", "multiplier": 60 },
    { "name": "bottle_120ml", "label": "120ml Bottle", "multiplier": 120 }
  ]
}`}
            </pre>
          </div>
        </section>
        {/* New: How it works */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">How it works</h2>
          <ol className="list-decimal ml-5 text-sm text-gray-700 space-y-2">
            <li>
              Add products and define packaging units (pieces, sheets, bottles,
              sachets). Each unit maps to a base stock unit using a multiplier.
            </li>
            <li>
              When adding stock, create batches with expiry dates. The system
              stores batch metadata for traceability and reporting.
            </li>
            <li>
              Sales deduct from the appropriate batch using FEFO/ FIFO policies
              (configurable). Sales entries include sale_items and reference the
              original batch when required.
            </li>
            <li>
              Analytics calculates revenue, cost (from product cost_price or
              batch-specific cost), and profit margins; reports can be filtered
              by date, staff, or product.
            </li>
          </ol>
        </section>

        {/* New: Deployment & Pricing notes */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Deployment & pricing notes
          </h2>
          <p className="text-sm text-gray-700 mb-3">
            MedCure Pro is packaged as a web application. For production we
            recommend hosting with a managed Postgres (Supabase, RDS) and a
            static host for the front-end (Vercel, Netlify). The system is
            optimized for single-store and multi-branch deployments.
          </p>
          <ul className="list-disc ml-5 text-sm text-gray-600">
            <li>
              Minimum recommended database: 1 vCPU, 2GB RAM for small stores
            </li>
            <li>Use daily backups and retention for auditability</li>
            <li>Consider using a read-replica for heavy reporting workloads</li>
          </ul>
        </section>

        {/* New: Security & Compliance */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Security & compliance</h2>
          <p className="text-sm text-gray-700 mb-3">
            The platform is designed to minimize sensitive data storage. Use
            secure authentication (Supabase or your identity provider), enable
            RLS policies on the database, and ensure HTTPS/TLS for all traffic.
          </p>
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-indigo-600" />
            <div className="text-sm text-gray-600">
              <div className="font-medium text-gray-900">Recommendations</div>
              <ul className="list-disc ml-5 mt-2">
                <li>Enable RLS and role-based access controls</li>
                <li>Use encryption-at-rest for database storage</li>
                <li>Enable 2FA for administrative users</li>
              </ul>
            </div>
          </div>
        </section>

        {/* New: Getting started */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Getting started checklist
          </h2>
          <ol className="list-decimal ml-5 text-sm text-gray-700 space-y-2">
            <li>
              Set up your Supabase/Postgres instance and add environment
              variables.
            </li>
            <li>
              Configure categories and basic product catalog or import via CSV.
            </li>
            <li>
              Define packaging templates for common products (tablets, bottles,
              sachets).
            </li>
            <li>
              Run a short training session with staff for POS workflows and
              returns.
            </li>
            <li>
              Enable backups and monitor daily reports for the first week.
            </li>
          </ol>
        </section>

        {/* New: Images needed */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-12">
          <h2 className="text-xl font-semibold mb-4">
            Images needed (place in /public/mockups)
          </h2>
          <p className="text-sm text-gray-700 mb-4">
            Below are suggested images to replace placeholders. Use PNG or
            optimized WebP for screenshots and SVG for icon-style graphics.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 border rounded p-4">
              <div className="font-semibold">hero-cta.png (or webp)</div>
              <div className="text-sm text-gray-600 mt-1">
                Large hero illustration showing product dashboard and CTA.
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Recommended: 1200×800px, PNG/WebP, compressed, alt: "Product
                dashboard with CTA"
              </div>
            </div>

            <div className="bg-gray-50 border rounded p-4">
              <div className="font-semibold">import-preview.png</div>
              <div className="text-sm text-gray-600 mt-1">
                Screenshot of CSV import preview table (first 5 rows visible).
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Recommended: 1000×600px, PNG/WebP, alt: "CSV import preview"
              </div>
            </div>

            <div className="bg-gray-50 border rounded p-4">
              <div className="font-semibold">product-variants.png</div>
              <div className="text-sm text-gray-600 mt-1">
                Illustration showing variants: bottle, sachet, sheet, box with
                quantities.
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Recommended: 1000×600px, PNG/WebP, alt: "Packaging variants
                illustration"
              </div>
            </div>

            <div className="bg-gray-50 border rounded p-4">
              <div className="font-semibold">batch-flow.png</div>
              <div className="text-sm text-gray-600 mt-1">
                Diagram of batch lifecycle: receive → store → sell → report /
                recall.
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Recommended: 1000×600px, PNG/WebP, alt: "Batch lifecycle
                diagram"
              </div>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            Icon assets (SVG):
            <ul className="list-disc ml-6 mt-2">
              <li>
                <code>icon-inventory.svg</code> — small 48×48 px icon for
                features grid
              </li>
              <li>
                <code>icon-packaging.svg</code> — small 48×48 px
              </li>
              <li>
                <code>icon-analytics.svg</code> — small 48×48 px
              </li>
            </ul>
          </div>
        </section>
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-3">CSV Import</h3>
            <p className="text-sm text-gray-600 mb-3">
              Use the provided CSV template to import products or batches. The
              importer intelligently maps categories, validates dates and
              quantities, and will create missing categories if allowed.
            </p>

            <h4 className="text-sm font-semibold mb-2">Recommended template</h4>
            <pre className="text-xs text-gray-700 overflow-auto p-2 bg-gray-50 border rounded">
              {`generic_name,brand_name,category_name,price_per_piece,stock_in_pieces,packaging_type,unit_1_label,unit_1_qty,unit_2_label,unit_2_qty,unit_3_label,unit_3_qty
"Paracetamol","Biogesic","Pain Relief",1.50,1000,standard,"Piece",1,"Sheet",10,"Box",100`}
            </pre>

            <div className="mt-4 flex gap-3">
              <a
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Get started
              </a>
              <a
                href="/login"
                className="px-4 py-2 border border-gray-200 rounded-md text-gray-700"
              >
                Login
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Integration notes</h3>
            <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
              <li>
                Tailwind CSS utility classes are used for layout and styling.
              </li>
              <li>
                CSV import uses `CSVImportService.parseCSV` and `validateData`.
              </li>
              <li>
                Packaging configuration saved on `products.packaging_config` as
                JSONB.
              </li>
              <li>
                Unit conversion helpers live in `src/utils/unitConversion.js`.
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Screenshots & Visuals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded overflow-hidden bg-gray-50 p-4">
              <img src="/mockups/hero-cta.png" alt="Hero CTAs" />
            </div>
            <div className="border rounded overflow-hidden bg-gray-50 p-4">
              <img src="/mockups/import-preview.png" alt="Import preview" />
            </div>
          </div>
        </section>

        <footer className="mt-12 text-center text-sm text-gray-600">
          <p>
            Need help integrating? Contact support or check the technical docs
            in the repo.
          </p>
        </footer>
      </div>
    </div>
  );
}
