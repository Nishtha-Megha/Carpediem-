import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Mail, Phone } from "lucide-react";
import { Logo } from "../brand/Logo";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";
  
const footerQuickLinks = [
    { label: "Home", href: "#home" },
    { label: "About Us", href: "#stats" },
    { label: "Events", href: "#events" },
    { label: "FAQ", href: "#faq" },
  ];

 

  const footerContactInfo = [
  { icon: MapPin, text: "LJ University, Ahmedabad, India", color: "#9ca3af" },
  { icon: Mail, text: "sports@ljku.edu.in", color: "#9ca3af" },
  { icon: Phone, text: "+91 98765 43210", color: "#9ca3af" },
];

  const footerDescription =
    "The official sports platform of LJ University. Register for tournaments, build teams and manage sporting events effortlessly.";

  const footerSocialIcons = [
    FaFacebookF,
    FaTwitter,
    FaInstagram,
    FaYoutube,
  ];

export function Footer() {
  return <footer className="relative bg-[#1e2b47] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-12 py-5">
        <div className="grid lg:grid-cols-[2fr_1fr_1fr] gap-16 text-left">

          {/* Logo & Description */}
          <div className="flex flex-col items-start">
            <Link to="/" className="mb-3 inline-block text-white hover:opacity-90 transition-opacity"><Logo /></Link>

            <p className="text-gray-300 text-sm leading-relaxed max-w-sm">{footerDescription}</p>

            <div className="flex gap-3 mt-4">
              {footerSocialIcons.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 bg-white/10 text-gray-300 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/15 hover:text-white hover:scale-110 hover:-translate-y-1"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-start">
           <h3 className="text-lg font-semibold text-white mb-4">
  Quick Links
</h3>
            {/* Quick Links */}
<div className="mb-4" />

{/* Contact */}
<div className="mb-4" />
            <ul className="space-y-2.5 text-sm text-gray-300">
              {footerQuickLinks.map((link) => (
                <li key={link.label}>
                  <a
  href={link.href}
  className="group flex items-center gap-1 text-gray-400 hover:text-gray-200 transition-all duration-300"
>
                    <ChevronRight
                      size={14}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-start">
            <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
            <div className="mb-4" />
            <div className="space-y-3 text-sm text-gray-300">
              {footerContactInfo.map(({ icon: Icon, text, color }, i) => (
                <p
  key={i}
  className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-all duration-300"
>
                  <Icon size={16} color={color} className="shrink-0" />
                  <span>{text}</span>
                </p>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Wave Effect */}
      <div className="relative w-full overflow-hidden leading-none z-0">
        <svg viewBox="0 0 1440 80" className="w-full h-8 block" preserveAspectRatio="none">
          <path
            fill="#465977"
            d="M0,50 C60,10 120,10 180,50 C240,90 300,90 360,50 C420,10 480,10 540,50 C600,90 660,90 720,50 C780,10 840,10 900,50 C960,90 1020,90 1080,50 C1140,10 1200,10 1260,50 C1320,90 1380,90 1440,50 L1440,100 L0,100 Z"
          />
        </svg>
      </div>

      {/* Copyright */}
      <div className="relative z-10 bg-[#465977] text-center py-4 text-xs text-gray-400">
        © 2026 CARPEDIEM. All Rights Reserved.
      </div>
    </footer>
}
