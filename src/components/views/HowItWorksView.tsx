import React from 'react';
import {
  Compass,
  Cpu,
  Layers,
  SlidersHorizontal,
  Scale,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Database,
  Search,
  ShieldCheck,
  Zap,
  BarChart2
} from 'lucide-react';

interface HowItWorksViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({ onNavigate }) => {
  const steps = [
    {
      num: '01',
      title: 'Data Collection & Verification',
      desc: 'We ingest product metadata directly from official brand specification sheets, FCC compliance documentation, and verified merchant listings.',
      icon: Database,
      tag: 'Data Pipeline',
    },
    {
      num: '02',
      title: 'Taxonomy & Attribute Normalization',
      desc: 'Raw text values are converted into structured, unit-normalized attributes (e.g., converting battery capacity to mAh, frequency to Hz, dimensions to mm).',
      icon: SlidersHorizontal,
      tag: 'Normalization Engine',
    },
    {
      num: '03',
      title: 'Real-Time Price & Offer Matching',
      desc: 'Our engine periodically checks active merchant offers across regional marketplaces (US, UK, DE, JP, CA) to display live prices and true List Price discounts.',
      icon: RefreshCw,
      tag: 'Merchant Resolver',
    },
    {
      num: '04',
      title: 'Interactive Multi-Product Comparison Matrix',
      desc: 'Users can select up to 4 items simultaneously to compare exact technical specifications line-by-line with instant highlight of numerical differences.',
      icon: Scale,
      tag: 'Side-by-Side Matrix',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-extrabold text-blue-600 tracking-wider uppercase bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
          Platform Architecture & Methodology
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 tracking-tight">
          How OmniDiscover Engine Works
        </h1>
        <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
          From raw manufacturer spec sheets to standardized side-by-side matrices, discover how we process technical data to deliver transparent purchasing intelligence.
        </p>
      </section>

      {/* 4-Step Pipeline Flow */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-100">
                    {step.tag}
                  </span>
                  <span className="text-3xl font-black text-neutral-300">
                    {step.num}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900">
                  {step.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Fully Automated & Verified</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Deep-Dive Technology Breakdown */}
      <section className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-14 border border-neutral-800 space-y-10">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Technical Specs Matrix
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Attribute Normalization Example
          </h2>
          <p className="text-sm text-neutral-400">
            How raw marketing descriptors are transformed into standardized, filterable database records.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Raw Marketing Text */}
          <div className="bg-neutral-800/80 p-6 rounded-2xl border border-neutral-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded border border-rose-800/60">
                Raw Unstructured Spec
              </span>
              <span className="text-xs text-neutral-500">Unstandardized</span>
            </div>
            <div className="p-4 rounded-xl bg-neutral-900 font-mono text-xs text-neutral-300 space-y-2 border border-neutral-800">
              <p>"Features a massive 5,000 milliamp-hour long-lasting battery with ultra-fast 65 Watt Turbo charging power..."</p>
            </div>
            <p className="text-xs text-neutral-400">
              Difficult to query, filter, or compare directly against competitor models using different units or marketing phrases.
            </p>
          </div>

          {/* Standardized Structured Record */}
          <div className="bg-neutral-800/80 p-6 rounded-2xl border border-neutral-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/60">
                OmniDiscover Normalized Schema
              </span>
              <span className="text-xs text-neutral-400">Filterable & Comparably Exact</span>
            </div>
            <div className="p-4 rounded-xl bg-neutral-900 font-mono text-xs text-emerald-400 space-y-1.5 border border-neutral-800">
              <p>battery_capacity: <span className="text-white">5000</span> (unit: "mAh")</p>
              <p>max_charging_power: <span className="text-white">65</span> (unit: "W")</p>
              <p>fast_charging_support: <span className="text-white">true</span></p>
            </div>
            <p className="text-xs text-neutral-400">
              Enables instant range filtering (e.g., "Battery &gt; 4500 mAh") and side-by-side numerical delta calculations.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl shadow-blue-600/20">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          Ready to Test the Comparison Engine?
        </h2>
        <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto leading-relaxed">
          Select products from our catalog or import any Amazon listing to view its full specification breakdown.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigate('products')}
            className="px-6 py-3 rounded-xl bg-white hover:bg-neutral-100 text-blue-900 font-bold text-sm transition-all shadow-md cursor-pointer"
          >
            Explore Catalog
          </button>
          <button
            onClick={() => onNavigate('compare')}
            className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm transition-all border border-blue-500 cursor-pointer"
          >
            Open Side-by-Side Compare
          </button>
        </div>
      </section>
    </div>
  );
};
