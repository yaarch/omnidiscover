import React from 'react';
import { Shield, Lock, Eye, CheckCircle2, FileText, Globe } from 'lucide-react';

interface PrivacyViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-neutral-200 pb-8">
        <span className="text-xs font-extrabold text-blue-600 tracking-wider uppercase bg-blue-50 px-3 py-1 rounded-md">
          Legal & Transparency
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
          Privacy Policy & Data Rights
        </h1>
        <p className="text-sm text-neutral-500">
          Last Updated: January 15, 2026 &bull; Compliant with GDPR, CCPA, and Global Consumer Privacy Frameworks.
        </p>
      </div>

      <div className="prose prose-neutral max-w-none space-y-8 text-neutral-700 text-sm leading-relaxed">
        {/* Summary Banner */}
        <div className="bg-blue-50/80 p-6 rounded-2xl border border-blue-200/80 space-y-3">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-base">
            <Lock className="w-5 h-5 text-blue-600" />
            <span>Privacy Summary at a Glance</span>
          </div>
          <p className="text-xs text-blue-950 leading-relaxed">
            OmniDiscover is an independent product comparison catalog. We do not sell personal data, track individual user identities across non-affiliated sites, or store payment credentials.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-neutral-900">1. Information We Do NOT Collect</h2>
          <p>
            OmniDiscover is built with a strict privacy-first architecture. <strong>We do NOT collect, store, track, or sell any personal data</strong>, personal identification details, user accounts, browsing histories, or payment credentials.
          </p>
          <p>
            The only non-personal data handled by the platform includes:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Local Device Preferences:</strong> Your selected market country, currency preference, and language setting are stored strictly locally on your own device.</li>
            <li><strong>Anonymous Usage Metrics:</strong> Non-personally identifiable, aggregated performance metrics (such as search queries or category filters) used solely to optimize catalog speed.</li>
            <li><strong>Voluntary Contact Messages:</strong> Information provided voluntarily if you submit a message via our contact form (Name, Email, Message) used strictly to respond to your inquiry.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-neutral-900">2. Cookies & Local Storage Usage</h2>
          <p>
            We utilize standard browser LocalStorage and essential session cookies for:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Remembering your active language preference (e.g. LTR vs RTL layout).</li>
            <li>Storing items saved to your side-by-side comparison drawer across page refreshes.</li>
            <li>Maintaining administrator session state when authenticated in the admin panel.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-neutral-900">3. Affiliate Tracking & Third-Party Retailers</h2>
          <p>
            OmniDiscover participates in retail affiliate programs (including the Amazon Associates Program). When you click an outbound link to a merchant (e.g., Amazon, Best Buy, B&amp;H), the retailer may place a cookie on your device to track purchase referrals.
          </p>
          <p>
            These third-party merchants operate under their own distinct privacy policies. We encourage users to review the privacy notices of external merchants when leaving our platform.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-neutral-900">4. GDPR & CCPA Consumer Rights</h2>
          <p>
            Under global privacy frameworks, you have the right to request deletion of any contact messages, request an export of locally stored preferences, or opt out of non-essential analytics cookies.
          </p>
          <p>
            To exercise these rights, please submit a request via our <button onClick={() => onNavigate('contact')} className="text-blue-600 font-semibold underline cursor-pointer">Contact Page</button>.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-4 border-t border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900">5. Contact Us Regarding Privacy</h2>
          <p>
            If you have questions or concerns about this Privacy Policy, please reach out to our privacy officer at <strong>privacy@omnidiscover.com</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};
