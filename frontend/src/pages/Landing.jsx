import { useEffect, useRef, useState } from "react";
import { Link, useNavigate , useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "../components/layout/Footer";
import { Logo } from "../components/brand/Logo";
import heroImage from "../assets/images/logo.png";
import {
  ArrowRight,
  BookmarkPlus,
  CalendarDays,
  ChevronRight,
  Heart,
  LayoutDashboard,
  Menu,
  Moon,
  Play,
  Share2,
  Sparkles,
  Star,
  Sun,
  X,
  MapPin,
  Mail,
  Phone
} from "lucide-react";
import { CountUp } from "../components/ui/CountUp";
import { ScrollReveal } from "../components/ui/ScrollReveal";
import { Accordion } from "../components/ui/Accordion";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../auth";
import { api, getApiErrorMessage } from "../api";

import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";


function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={10}
          fill={i < rating ? "#f59e0b" : "none"}
          stroke={i < rating ? "#f59e0b" : "var(--text-muted)"}
        />
      ))}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "/about" },
  { label: "FAQ", href: "#faq" },
];

const STATS = [
  { label: "LJ Students", end: 1500, suffix: "+" },
  { label: "Sports Events", end: 80, suffix: "+" },
  { label: "Registrations", end: 4500, suffix: "+" },
  { label: "LJ Departments", end: 20, suffix: "+" }
];

const HOW_IT_WORKS = [
  { step: "01", title: "Create your account", desc: "Sign up in seconds. Students get a user dashboard, staff get role-appropriate admin access." },
  { step: "02", title: "Browse & Register", desc: "Discover upcoming sports events, view details, register solo or build a team — all in one flow." },
  { step: "03", title: "Attend & Participate", desc: "Show your QR code at the door to verify your entry and participate in the match." }
];



const FAQ_ITEMS = [
  { id: "f1", question: "Who can use Carpediem?", answer: "Carpediem is built for LJ University. Students use the platform to discover and register for events, while staff (admins, event managers, volunteers) manage everything from the admin panel." },
  { id: "f2", question: "Can we manage multiple events simultaneously?", answer: "Absolutely. You can create, publish, and manage unlimited events in parallel. Each event has independent settings, seats, and scheduling." },
  { id: "f3", question: "How does team registration work?", answer: "Event managers set the team size and maximum teams. Students register as a captain and add member details (name, email, enrollment, branch) during the flow." },
  { id: "f5", question: "What roles are available for staff?", answer: "Super Admin, Admin, Event Manager, Volunteer, and Viewer — each with fine-grained permissions managed through our role system." },
  { id: "f6", question: "Is the platform mobile friendly?", answer: "Fully responsive. Students can register and view their QR codes on mobile. Volunteers can mark attendance on phones. Admins have full dashboard access on tablets." }
];

const MARQUEE_LOGOS = [
  "LJIET",
  "LJIMS",
  "LJICA",
  "LJSL",
  "LJCP",
  "LJIAS",
  "LJ Polytechnic",
  "LJMBA"
];

// ─── Footer Data (used by the DarkFooter component below) ────────────────────
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


export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [likedEvents, setLikedEvents] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const heroRef = useRef(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);

      if (element) {
        setTimeout(() => {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    }
  }, [location]);

  useEffect(() => {
    let active = true;
    async function loadEvents() {
      try {
        const res = await api.get("/events?is_published=true");
        if (active) {
          setEvents(res.data.data ?? []);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(getApiErrorMessage(err));
          setLoading(false);
        }
      }
    }
    loadEvents();
    return () => {
      active = false;
    };
  }, []);

  // Scroll detection
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Mouse parallax
  useEffect(() => {
    const handler = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 24;
      const y = (e.clientY / window.innerHeight - 0.5) * 16;
      setParallax({ x, y });
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  function toggleLike(id) {
    setLikedEvents((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  function toggleSave(id) {
    setSavedEvents((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ══ NAVBAR ═══════════════════════════════════════════════════════════ */}
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${scrolled ? "glass-strong py-3 shadow-lg" : "glass py-4 shadow-sm"
          }`}
      >
        <div className="container flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-display font-black text-xl tracking-tight" style={{ color: "var(--text-primary)" }}>
            <Logo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="
                  group relative rounded-xl px-4 py-2 text-sm font-medium
                  transition-all duration-300
                  hover:-translate-y-0.5
                "
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                {item.label}

                <span
                  className="
                    absolute bottom-1 left-1/2 h-[2px] w-0
                    -translate-x-1/2 rounded-full
                    bg-gradient-to-r from-indigo-500 to-cyan-400
                    transition-all duration-300
                    group-hover:w-8
                  "
                />
              </a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="btn-ghost hidden h-9 w-9 place-items-center rounded-full md:grid"
              aria-label="Toggle theme"
            >
              <motion.div key={theme} initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.25 }}>
                {isDark ? <Moon size={16} /> : <Sun size={16} />}
              </motion.div>
            </button>

            <Link to="/login" className="btn btn-primary hidden text-sm md:inline-flex">
              Get Started <ArrowRight size={15} />
            </Link>

            {/* Mobile menu */}
            <button className="btn-ghost grid h-9 w-9 place-items-center rounded-full md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div className="fixed inset-0 z-50" style={{ background: "var(--overlay-bg)", backdropFilter: "blur(8px)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} />
            <motion.div
              className="glass-strong fixed inset-y-0 right-0 z-50 flex w-72 flex-col p-6"
              initial={{ x: 288 }} animate={{ x: 0 }} exit={{ x: 288 }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="brand-logo text-xl">CARPEDIEM</span>
                </div>
                <button className="btn-ghost p-2" onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
              </div>
              <nav className="flex flex-col gap-2">
                {NAV_ITEMS.map((item) => (
                  <a key={item.label} href={item.href} className="nav-item" onClick={() => setMobileMenuOpen(false)}>{item.label}</a>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-3">
                <button className="btn btn-primary w-full" onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}>Get Started</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}

      <section
        id="home"
        ref={heroRef}
        className="relative flex min-h-screen items-center overflow-hidden pt-24 pb-16"
      >  <img
          src={heroImage}
          alt="LJ University Ahmedabad campus"
          className="absolute inset-0 h-full w-full object-cover brightness-[0.62]"
        />
        <div className="absolute inset-0 bg-slate-950/35" aria-hidden="true" />
        {/* Ambient glow blobs */}
        <div className="hero-blobs">

          <div
            className="hero-blob hero-blob-green animate-blob"
            style={{
              width: "450px",
              height: "450px",
              top: "10%",
              left: "-100px",
            }}
          />

          <div
            className="hero-blob hero-blob-cyan animate-blob animation-delay-2000"
            style={{
              width: "500px",
              height: "500px",
              top: "20%",
              right: "-150px",
            }}
          />

          <div
            className="hero-blob hero-blob-indigo animate-blob animation-delay-4000"
            style={{
              width: "400px",
              height: "400px",
              bottom: "-100px",
              left: "40%",
            }}
          />

        </div>

        {/* Main content */}
        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="launch-badge">
              <span className="launch-icon">⚽</span>
              <span>LJ university Carpediem SportsHub</span>
            </div>
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{
                once: false,
                amount: 0.4,
              }}
              transition={{
                duration: 1,
              }}
              className="hero-heading mt-12 font-display text-6xl font-black leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl"
              style={{ color: "#ffffff" }}
            >
              The premium campus{" "}
              <span
                className="
                  hero-platform-gradient
                  transition-all duration-500
                  hover:drop-shadow-[0_0_25px_rgba(129,140,248,0.55)]
                "
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #5f99f7 0%, #8feced 48%, #e48af4 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                }}
              >
                event platform
              </span>
              {" "}
              for LJ University.
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{
                opacity: 0,
                y: 40,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: false,
                amount: 0.3,
              }}
              transition={{
                duration: 0.8,
                delay: 0.2,
              }}
              className="hero-subtitle mx-auto mt-7 max-w-2xl text-xl leading-8"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              Discover sports events, register your team, track match schedules,
              and verify attendance with QR codes — all in one beautiful platform.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{
                once: false,
                amount: 0.3
              }}
              transition={{
                duration: 0.8
              }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link to="/login" className="btn btn-primary btn-lg">
                Get Started <ArrowRight size={18} />
              </Link>
              <a
                href="#how-it-works"
                className="
                  group btn btn-secondary btn-lg
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:border-indigo-400/50
                  hover:bg-indigo-500/10
                  hover:shadow-[0_10px_30px_rgba(99,102,241,0.15)]
                "
              >
                <Play
                  size={16}
                  className="
                    text-indigo-400
                    transition-transform duration-300
                    group-hover:scale-125
                    group-hover:rotate-6
                  "
                />
                See how it works
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════════════════════════ */}
      <section id="stats" className="section">
        <div className="container">
          <ScrollReveal className="mb-12 text-center">
            <h2 className="font-display text-5xl font-black" style={{ color: "var(--text-primary)" }}>
              LJ University Campus Sports & Events
            </h2>
          </ScrollReveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map(({ label, end, suffix }, i) => (
              <ScrollReveal key={label} delay={i * 0.08}>
                <div
                  className="
                    glass-premium group rounded-[1.5rem] p-6 text-center
                    transition-all duration-400
                    hover:-translate-y-2
                    hover:scale-[1.02]
                    hover:border-indigo-400/30
                    hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)]
                  "
                >
                  <div className="font-display text-5xl font-black text-gradient transition-all duration-300 group-hover:scale-110 group-hover:filter group-hover:drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]">
                    <CountUp end={end} suffix={suffix} />
                  </div>
                  <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="section">
        <div className="container">
          <ScrollReveal className="mb-14 text-center">
            <p className="section-label"><LayoutDashboard size={14} /> How it works</p>
            <h2 className="font-display text-5xl font-black" style={{ color: "var(--text-primary)" }}>Three steps to your first event</h2>
          </ScrollReveal>
          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <ScrollReveal key={step} delay={i * 0.1} direction="up" className="h-full">
                <div className="relative h-full flex flex-col">
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="absolute right-0 top-10 hidden w-1/2 border-t border-dashed md:block" style={{ borderColor: "var(--border-default)" }} />
                  )}
                  <div
                    className="
                      glass-premium rounded-[1.75rem] p-8
                      h-full flex flex-col flex-1
                      transition-all duration-400
                      hover:-translate-y-3
                      hover:border-cyan-400/30
                      hover:shadow-[0_20px_50px_rgba(34,211,238,0.12)]
                    "
                  >
                    <div
                      className="
                        font-display text-6xl font-black text-gradient
                        opacity-25
                        transition-all duration-300
                        group-hover:opacity-60
                        group-hover:scale-105
                      "
                    >
                      {step}
                    </div>
                    <h3 className="font-display text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>{title}</h3>
                    <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURED EVENTS ════════════════════════════════════════════════════ */}


      {/* ══ FAQ SECTION ════════════════════════════════════════════════════════ */}
      <section id="faq" className="section">
        <div className="container">
          <ScrollReveal className="mb-14 text-center">
            <h2 className="font-display text-5xl font-black mb-4" style={{ color: "var(--text-primary)" }}>
              Frequently Asked Questions
            </h2>
            <p className="max-w-xl mx-auto text-sm" style={{ color: "var(--text-muted)" }}>
              Everything you need to know about the LJ Carpediem campus sports & event platform.
            </p>
          </ScrollReveal>

          <div className="max-w-3xl mx-auto space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <ScrollReveal
                key={item.id}
                once={false}
                delay={index * 0.08}
              >
                <Accordion items={[item]} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════════ */}
      <Footer />
    </div>
  );
}
