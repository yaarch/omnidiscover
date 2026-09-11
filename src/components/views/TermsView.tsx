import React from 'react';
import { FileText, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';

interface TermsViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const TermsView: React.FC<TermsViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-neutral-200 pb-8">
        <span className="text-xs font-extrabold text-blue-600 tracking-wider uppercase bg-blue-50 px-3 py-1 rounded-md">
          Legal Terms
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
          Terms of Service & Usage Agreement
        </h1>
        <p className="text-sm text-neutral-500">
          Last Updated: January 15, 2026 &bull; Governs access and usage of OmniDiscover comparison platform.
        </p>
      </div>

      <div className="prose prose-neutral max-w-none space-y-8 text-neutral-700 text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-neutral-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using OmniDiscover ("Platform"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our comparison engine or catalog directories.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-neutral-900">2. Product Specification & Pricing Disclaimer</h2>
          <p>
            OmniDiscover aggregates technical specifications, merchant offers, and pricing data for informational and comparison purposes. While we perform rigorous audits:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Product pricing, merchant stock availability, and promotional offers change rapidly and are controlled entirely by third-party retailers.</li>
            <li>Users MUST verify final pricing, shipping fees, tax, and warranty details directly on the merchant's checkout page prior to completing a purchase.</li>
            <li>OmniDiscover is not responsible for pricing discrepancies or errors on merchant sites.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-neutral-900">3. Affiliate Relationship Disclosure</h2>
          <p>
            OmniDiscover participates in affiliate marketing programs, including the Amazon Associates Program. When you click links to buy products, we may receive financial compensation or referral commissions from the participating merchants.
          </p>
          <p>
            This affiliate relationship does not influence our objective specification data, benchmark algorithms, or side-by-side technical delta calculations.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-neutral-900">4. Intellectual Property</h2>
          <p>
            All platform designs, comparison algorithms, taxonomy structures, and custom software code on OmniDiscover are protected by copyright, trademark, and intellectual property laws. Third-party brand logos, trademarks, and product images belong to their respective brand owners.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-4 border-t border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900">5. Limitation of Liability</h2>
          <p>
            OmniDiscover is provided on an "as is" and "as available" basis without warranties of any kind. In no event shall OmniDiscover be liable for any direct, indirect, incidental, or consequential damages arising from your reliance on product specifications or merchant pricing displayed on our platform.
          </p>
        </section>
      </div>
    </div>
  );
};
