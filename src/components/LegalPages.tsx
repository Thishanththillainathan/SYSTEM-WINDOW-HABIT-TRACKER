import React from 'react';
import { Footer } from './Footer';
import {
  FileText,
  Lock,
  RefreshCw,
  Truck,
  PhoneCall,
  Tag,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onNavigateHome: () => void;
  children: React.ReactNode;
}

const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  title,
  subtitle,
  icon,
  onNavigateHome,
  children
}) => {
  return (
    <div className="min-h-screen bg-[#070210] text-white flex flex-col justify-between font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Header Navigation Bar */}
      <header className="border-b border-white/15 bg-[#0a0318]/90 backdrop-blur-xl px-4 sm:px-8 py-4 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateHome}
            className="p-2 rounded-xl bg-white/5 border border-white/15 hover:bg-white/15 text-white/80 hover:text-white transition flex items-center space-x-2 font-mono text-xs"
          >
            <ArrowLeft className="w-4 h-4 text-purple-300" />
            <span>RETURN TO SYSTEM</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 font-orbitron font-bold text-sm tracking-wider text-purple-300">
          <ShieldCheck className="w-5 h-5 text-purple-400" />
          <span className="hidden sm:inline">SYSTEM WINDOW LEGAL PROTOCOLS</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex-1 space-y-8">
        {/* Page Hero Header */}
        <div className="system-panel p-6 sm:p-8 rounded-2xl border-white/20 bg-[#0d041a]/80 backdrop-blur-xl text-center space-y-3 relative overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.2)]">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-300 mx-auto">
            {icon}
          </div>
          <h1 className="font-orbitron font-bold text-2xl sm:text-3xl text-white tracking-wider text-glow uppercase">
            {title}
          </h1>
          <p className="text-xs font-mono text-purple-300/80 max-w-lg mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Content Container */}
        <div className="system-panel p-6 sm:p-8 rounded-2xl border-white/15 bg-white/5 backdrop-blur-md space-y-6 font-mono text-xs leading-relaxed text-white/90">
          {children}
        </div>
      </main>

      {/* Footer Component on Every Legal Page */}
      <Footer onNavigate={(path) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new Event('popstate'));
      }} />
    </div>
  );
};

/* 1. TERMS AND CONDITIONS PAGE */
export const TermsPage: React.FC<{ onNavigateHome: () => void }> = ({ onNavigateHome }) => {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      subtitle="System Window Usage Terms & User Agreement"
      icon={<FileText className="w-7 h-7 text-purple-300" />}
      onNavigateHome={onNavigateHome}
    >
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron tracking-wide uppercase border-b border-white/10 pb-2">
          1. Acceptance of Terms
        </h2>
        <p>
          By accessing or using the Solo Leveling / System Window Habit Tracker platform, you agree to be bound by these Terms and Conditions. If you do not agree to all of these terms, you must discontinue your use of the service immediately.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron tracking-wide uppercase border-b border-white/10 pb-2">
          2. Account Registration & Responsibility
        </h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials (email and password/OTP). You accept full responsibility for all activities that occur under your account. You agree to notify us immediately of any unauthorized access or breach of security.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron tracking-wide uppercase border-b border-white/10 pb-2">
          3. Service Description & Subscriptions
        </h2>
        <p>
          System Window provides habit tracking, schedule planning, and productivity gamification tools. Paid subscription plans (3 Months and 12 Months) grant full access to system features for the stated duration. Access duration is governed strictly by backend system expiry.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron tracking-wide uppercase border-b border-white/10 pb-2">
          4. Prohibited Conduct
        </h2>
        <p>
          Users may not attempt to reverse engineer, disrupt, hack, or exploit the platform, manipulate payment verification signatures, or automate abusive requests against our backend APIs. Violation of these rules results in instant account termination.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron tracking-wide uppercase border-b border-white/10 pb-2">
          5. Modifications to Service
        </h2>
        <p>
          We reserve the right to modify or discontinue any part of the service with or without prior notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
        </p>
      </section>
    </LegalPageLayout>
  );
};

/* 2. PRIVACY POLICY PAGE */
export const PrivacyPage: React.FC<{ onNavigateHome: () => void }> = ({ onNavigateHome }) => {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="Data Collection, Protection & Security Protocols"
      icon={<Lock className="w-7 h-7 text-purple-300" />}
      onNavigateHome={onNavigateHome}
    >
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron tracking-wide uppercase border-b border-white/10 pb-2">
          1. Data We Collect
        </h2>
        <p>
          We respect your privacy. In order to provide habit tracking and productivity services, we store:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-white/80">
          <li>Account Information: Name/Username and Email Address.</li>
          <li>Productivity Data: Habits, daily quests, schedule entries, and rank achievements.</li>
          <li>Transaction Records: Subscription plan details, transaction IDs, payment status, and start/expiry timestamps.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron tracking-wide uppercase border-b border-white/10 pb-2">
          2. Payment Information Security
        </h2>
        <p className="p-3 rounded-xl bg-purple-950/60 border border-purple-400/40 text-purple-200">
          <strong>Important Payment Security Note:</strong> All payments are securely processed by <strong>Razorpay</strong>. We do <strong>NOT</strong> store or process your credit/debit card numbers, CVVs, netbanking passwords, or UPI PINs on our servers. All sensitive financial transactions are handled end-to-end by Razorpay’s PCI-DSS compliant payment gateway.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron tracking-wide uppercase border-b border-white/10 pb-2">
          3. How We Use Your Data
        </h2>
        <p>
          Your data is used solely to authenticate your account, maintain your habit streak records, compute rank promotions, and enforce valid subscription access. We do not sell or trade your personal information to third parties.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron tracking-wide uppercase border-b border-white/10 pb-2">
          4. Account Deletion Request
        </h2>
        <p>
          Users can request full deletion of their account and all associated habit/schedule data at any time. To request account deletion, please email us at <span className="text-purple-300 font-bold">{"{{EMAIL: thishantht644@gmail.com}}"}</span> with your registered account email address. Account deletion requests are processed within 48 hours.
        </p>
      </section>
    </LegalPageLayout>
  );
};

/* 3. CANCELLATION AND REFUND POLICY PAGE */
export const RefundPolicyPage: React.FC<{ onNavigateHome: () => void }> = ({ onNavigateHome }) => {
  return (
    <LegalPageLayout
      title="Cancellation & Refund Policy"
      subtitle="Subscription Cancellation & Refund Rules"
      icon={<RefreshCw className="w-7 h-7 text-purple-300" />}
      onNavigateHome={onNavigateHome}
    >
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron tracking-wide uppercase border-b border-white/10 pb-2">
          1. Refund Policy Rule
        </h2>
        <div className="p-4 rounded-xl bg-purple-950/70 border border-purple-400/50 text-purple-200 font-bold">
          {"{{REFUND_RULE:No refund once the pass is working. Full refund only if something goes wrong with the payment (money cut but pass not activated, or charged twice).  }}"}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron tracking-wide uppercase border-b border-white/10 pb-2">
          2. Refund Processing Timeline
        </h2>
        <div className="p-4 rounded-xl bg-white/5 border border-white/15 text-white/90">
          {"{{REFUND_DAYS:how many days the money takes to reach the customer after you refund. The answer is 5-7 business days.  }}"}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron tracking-wide uppercase border-b border-white/10 pb-2">
          3. How to Request a Refund for Failed/Double Charges
        </h2>
        <p>
          If your money was debited from your bank account but your System Pass was not activated, or if you were accidentally charged twice for a single order, please contact our support immediately:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-white/80">
          <li>Email: <span className="text-purple-300 font-bold">{"{{EMAIL: thishantht644@gmail.com}}"}</span></li>
          <li>Phone: <span className="text-purple-300 font-bold">{"{{7810092121}}"}</span></li>
          <li>Include your Razorpay Payment ID or transaction screenshot for fast verification.</li>
        </ul>
      </section>
    </LegalPageLayout>
  );
};

/* 4. SHIPPING AND DELIVERY POLICY PAGE */
export const ShippingPolicyPage: React.FC<{ onNavigateHome: () => void }> = ({ onNavigateHome }) => {
  return (
    <LegalPageLayout
      title="Shipping & Delivery Policy"
      subtitle="Digital SaaS Service Activation Protocols"
      icon={<Truck className="w-7 h-7 text-purple-300" />}
      onNavigateHome={onNavigateHome}
    >
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron tracking-wide uppercase border-b border-white/10 pb-2">
          1. Digital Service Nature
        </h2>
        <p>
          System Window Habit Tracker is a 100% digital Software-as-a-Service (SaaS) web application. There are <strong>no physical goods, shipping, or physical delivery</strong> involved in any purchase on this platform.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron tracking-wide uppercase border-b border-white/10 pb-2">
          2. Instant Service Delivery & Access
        </h2>
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-400/40 text-emerald-200">
          Upon successful payment verification via Razorpay, your subscription pass (3 Months or 12 Months) is activated <strong>instantly and automatically</strong> on your account. You will receive immediate full access to all habit tracking, schedule matrix, and RPG features.
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron tracking-wide uppercase border-b border-white/10 pb-2">
          3. Delivery Issues & Support
        </h2>
        <p>
          If you experience any delay in feature activation after payment, please refresh your browser session or click "Refresh" on the Subscription page. If the issue persists, contact us at <span className="text-purple-300 font-bold">{"{{EMAIL: thishantht644@gmail.com}}"}</span>.
        </p>
      </section>
    </LegalPageLayout>
  );
};

/* 5. CONTACT US PAGE */
export const ContactPage: React.FC<{ onNavigateHome: () => void }> = ({ onNavigateHome }) => {
  return (
    <LegalPageLayout
      title="Contact Us"
      subtitle="Get in Touch with System Window Support"
      icon={<PhoneCall className="w-7 h-7 text-purple-300" />}
      onNavigateHome={onNavigateHome}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/15 space-y-1">
          <div className="text-[11px] text-white/50 uppercase font-bold">BUSINESS / OWNER NAME</div>
          <div className="text-sm font-bold text-purple-300 font-orbitron">
            {"{{THISHANTH}}"}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/15 space-y-1">
          <div className="text-[11px] text-white/50 uppercase font-bold">EMAIL SUPPORT</div>
          <div className="text-sm font-bold text-purple-300">
            {"{{EMAIL: thishantht644@gmail.com}}"}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/15 space-y-1">
          <div className="text-[11px] text-white/50 uppercase font-bold">PHONE NUMBER</div>
          <div className="text-sm font-bold text-purple-300">
            {"{{7810092121}}"}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/15 space-y-1">
          <div className="text-[11px] text-white/50 uppercase font-bold">ADDRESS</div>
          <div className="text-sm font-bold text-purple-300">
            {"{{N.Pudupatti, Namakkal}}"}
          </div>
        </div>
      </div>

      <section className="space-y-2 pt-2">
        <h2 className="text-sm font-bold text-purple-300 font-orbitron uppercase border-b border-white/10 pb-2">
          Customer Support Hours
        </h2>
        <p className="text-white/80">
          Our support team is available Monday through Saturday from 9:00 AM to 6:00 PM IST. We strive to respond to all email inquiries within 24 hours.
        </p>
      </section>
    </LegalPageLayout>
  );
};

/* 6. PRICING PAGE */
export const PricingPage: React.FC<{ onNavigateHome: () => void }> = ({ onNavigateHome }) => {
  return (
    <LegalPageLayout
      title="System Access"
      subtitle="Transparent System Window Access"
      icon={<Tag className="w-7 h-7 text-purple-300" />}
      onNavigateHome={onNavigateHome}
    >
      <div className="space-y-6">
        <div className="p-5 rounded-2xl bg-purple-950/40 border-2 border-purple-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
          <div>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase">FULL ACCESS</span>
            <h3 className="font-orbitron font-bold text-lg text-white mt-1">HUNTER ACCESS</h3>
            <p className="text-xs text-purple-300/90 font-bold mt-1">
              Full System Access - Unlimited habits, schedules, quests, RPG rank progression, and boss battles.
            </p>
          </div>
          <div className="sm:text-right">
            <div className="font-orbitron font-bold text-3xl text-purple-300 text-glow">FREE</div>
            <div className="text-[11px] text-white/60">Full Access</div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/60 font-mono space-y-1">
        <div>• All System Window features are free and open to all registered hunters.</div>
        <div>• Full system features (Habits, Schedule, Quests, XP, Rank promotions) are fully accessible.</div>
      </div>
    </LegalPageLayout>
  );
};
