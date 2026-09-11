import React from 'react';
import {
  Compass,
  ShieldCheck,
  CheckCircle2,
  Award,
  Globe,
  SlidersHorizontal,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  Search,
  Users,
  Target,
  FileText
} from 'lucide-react';

interface AboutViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-blue-950 text-white rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-xl border border-neutral-800">
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Independent Product Intelligence Engine</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Empowering Buyers with Objective, Lab-Verified Specification Benchmarks.
          </h1>
          <p className="text-base sm:text-lg text-neutral-300 leading-relaxed font-normal">
            OmniDiscover was founded on a simple principle: product discovery should be driven by standardized technical truth, direct merchant price transparency, and unbiased specs—not promotional noise.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('products')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Full Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('how-it-works')}
              className="px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-sm transition-all border border-neutral-700 cursor-pointer"
            >
              Our Methodology
            </button>
          </div>
        </div>

        {/* Decorative Grid Background */}
        <div className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none">
          <Compass className="w-96 h-96 text-white" />
        </div>
      </section>

      {/* Core Mission Pillars */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-extrabold text-blue-600 tracking-wider uppercase bg-blue-50 px-3 py-1 rounded-md">
            Why OmniDiscover
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Built for Critical Tech Consumers & Buyers
          </h2>
          <p className="text-sm sm:text-base text-neutral-600">
            We solve the fragmented product information ecosystem by standardizing data schemas into actionable side-by-side matrices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4 hover:border-blue-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">100% Editorial Independence</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Brands cannot purchase top rankings, artificial specification scores, or paid placement on our comparison matrices. Our data pipeline is purely objective.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4 hover:border-blue-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Standardized Attribute Schemas</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Every item is mapped into strict attribute definitions—enabling apple-to-apples comparisons across display technology, battery capacity, acoustics, and dimensions.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4 hover:border-blue-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Multi-Market Price Transparency</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              We monitor verified merchant offers across international markets (US, UK, DE, JP, CA) and currencies (USD, EUR, GBP, JPY, CAD) with real-time updates.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-12 border border-neutral-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-5xl font-black text-blue-400">100%</div>
            <div className="text-xs sm:text-sm text-neutral-400 font-medium">Independent Benchmarks</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-5xl font-black text-emerald-400">500+</div>
            <div className="text-xs sm:text-sm text-neutral-400 font-medium">Standardized Spec Attributes</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-5xl font-black text-amber-400">5</div>
            <div className="text-xs sm:text-sm text-neutral-400 font-medium">Supported Global Markets</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-5xl font-black text-purple-400">Real-Time</div>
            <div className="text-xs sm:text-sm text-neutral-400 font-medium">Merchant Price Monitoring</div>
          </div>
        </div>
      </section>

      {/* Editorial Guidelines & Standards */}
      <section className="bg-white rounded-3xl p-8 sm:p-12 border border-neutral-200/80 shadow-xs space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
          <div>
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Our Commitment</span>
            <h2 className="text-2xl font-bold text-neutral-900 mt-1">Editorial Integrity & Verification Principles</h2>
          </div>
          <button
            onClick={() => onNavigate('contact')}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition-colors self-start md:self-auto cursor-pointer"
          >
            Contact Editorial Team
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-neutral-600">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-neutral-900 text-base mb-1">Strict Fact Verification</h4>
                <p className="leading-relaxed">
                  Every technical specification is double-checked against manufacturer datasheets, regulatory FCC filings, and physical laboratory measurements before indexing.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-neutral-900 text-base mb-1">Transparent Affiliate Funding</h4>
                <p className="leading-relaxed">
                  We participate in retail affiliate programs (such as Amazon Associates). When users purchase through our links, we may earn a referral fee. This never alters product ratings or prices.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-neutral-900 text-base mb-1">No Sponsored Spec Alterations</h4>
                <p className="leading-relaxed">
                  Product attribute values (weight, frequency response, battery size) are immutable facts. Advertisers cannot pay to alter numerical specs or benchmark outputs.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-neutral-900 text-base mb-1">Continuous Catalog Audits</h4>
                <p className="leading-relaxed">
                  Our database engine runs regular automated audits to detect discontinued models, outdated pricing, or spec revisions released by manufacturers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
