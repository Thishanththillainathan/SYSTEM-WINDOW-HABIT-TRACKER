import React from 'react';
import { ShieldCheck, FileText, Lock, RefreshCw, Truck, PhoneCall, Tag } from 'lucide-react';

interface FooterProps {
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <footer className="w-full bg-[#070312]/95 border-t border-white/15 text-white/70 py-8 px-4 sm:px-8 font-mono text-xs z-30 relative backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & System Title */}
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start space-x-2 text-purple-300 font-orbitron font-bold text-sm tracking-wider">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>SYSTEM WINDOW — HABIT TRACKER</span>
          </div>
          <p className="text-[11px] text-white/50">
            Solo Leveling Productivity System. All rights reserved.
          </p>
        </div>

        {/* Legal & Trust Page Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono">
          <a
            href="/terms"
            onClick={(e) => handleLinkClick(e, '/terms')}
            className="hover:text-purple-300 transition flex items-center space-x-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Terms & Conditions</span>
          </a>

          <a
            href="/privacy"
            onClick={(e) => handleLinkClick(e, '/privacy')}
            className="hover:text-purple-300 transition flex items-center space-x-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span>Privacy Policy</span>
          </a>

          <a
            href="/refund-policy"
            onClick={(e) => handleLinkClick(e, '/refund-policy')}
            className="hover:text-purple-300 transition flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span>Cancellation & Refund</span>
          </a>

          <a
            href="/shipping-policy"
            onClick={(e) => handleLinkClick(e, '/shipping-policy')}
            className="hover:text-purple-300 transition flex items-center space-x-1.5"
          >
            <Truck className="w-3.5 h-3.5 text-purple-400" />
            <span>Shipping Policy</span>
          </a>

          <a
            href="/contact"
            onClick={(e) => handleLinkClick(e, '/contact')}
            className="hover:text-purple-300 transition flex items-center space-x-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5 text-purple-400" />
            <span>Contact Us</span>
          </a>

          <a
            href="/pricing"
            onClick={(e) => handleLinkClick(e, '/pricing')}
            className="hover:text-purple-300 transition flex items-center space-x-1.5"
          >
            <Tag className="w-3.5 h-3.5 text-purple-400" />
            <span>Pricing</span>
          </a>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 text-center text-[10px] text-white/40 font-mono">
        Secured by Razorpay. End-to-end encrypted session.
      </div>
    </footer>
  );
};

export default Footer;
