import { Link } from "react-router-dom";
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "../components/brand/Logo";
import { Footer } from "../components/layout/Footer";
import { ScrollReveal } from "../components/ui/ScrollReveal";
import { useTheme } from "../hooks/useTheme";
import campusImage from "../assets/images/logo.png";
import p1 from "../assets/images/p1.jpg";
import p2 from "../assets/images/p2.jpg";
import p3 from "../assets/images/p3.png";
import p4 from "../assets/images/p4.png";
import p5 from "../assets/images/p5.png";
import p6 from "../assets/images/p6.png";
import p7 from "../assets/images/p7.png";
import p8 from "../assets/images/p8.png";
import p9 from "../assets/images/p9.png";
import p10 from "../assets/images/p10.png";

const sportsPhotos = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10].map((src, index) => ({
  src,
  alt: `LJ University sports photo ${index + 1}`,
}));

export default function About() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="about-navbar sticky top-0 z-40 border-b border-white/[0.08]"
      >
        <div className="container relative flex h-16 items-center justify-between gap-4">
          <Link to="/"><Logo /></Link>
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 md:flex">
            <Link to="/" className="nav-item">Home</Link>
            <Link to="/#events" className="nav-item">Events</Link>
          </nav>
          <motion.button
            whileHover={{ scale: 1.08, rotate: 8 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
            className="theme-icon-button btn-ghost ml-auto hidden h-10 w-10 place-items-center rounded-full md:grid"
            aria-label="Toggle theme"
          >
            <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.25 }}>
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </motion.span>
          </motion.button>
          <button className="btn-ghost grid h-9 w-9 place-items-center rounded-full md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
      </motion.header>

      {menuOpen && (
        <div className="glass-strong fixed inset-0 z-50 flex flex-col p-6 md:hidden">
          <div className="flex items-center justify-between">
            <Logo />
            <button className="btn-ghost p-2" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
          </div>
          <nav className="mt-10 flex flex-col gap-3">
            <Link to="/" className="nav-item" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/#events" className="nav-item" onClick={() => setMenuOpen(false)}>Events</Link>
            <span className="nav-item font-bold">About Us</span>
            <button onClick={toggleTheme} className="theme-icon-button btn-ghost grid h-10 w-10 place-items-center rounded-full" aria-label="Toggle theme">
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </nav>
        </div>
      )}

      <main>
        <section className="about-intro-section section">
          <div className="container">
            <div className="about-intro-card">
              <div className="about-intro-layout">
                <div>
                  <span className="launch-badge">LJ UNIVERSITY · CARPEDIEM</span>
                  <h1 className="animate-heading mt-8 font-display text-5xl font-black leading-tight sm:text-7xl">
                    Welcome to <span className="text-gradient">LJ University</span>
                  </h1>
                  <p className="animate-subtitle mt-6 max-w-3xl text-lg leading-8" style={{ color: "var(--text-secondary)" }}>
                    Carpediem brings the energy of LJ University sports into one connected platform. Students can discover tournaments, build teams, register for matches, and celebrate every moment of campus competition.
                  </p>
                  <p className="animate-description mt-4 max-w-3xl leading-7" style={{ color: "var(--text-muted)" }}>
                    From the first whistle to the final score, our goal is to make university sports more accessible, organized, and memorable for everyone.
                  </p>
                </div>
                <img className="about-intro-image animate-image" src={campusImage} alt="LJ University campus and sports ground" />
              </div>
            </div>
          </div>
        </section>

        <section className="about-gallery-section section">
          <div className="container">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <p className="animate-heading section-kicker">Campus in motion</p>
              <h2 className="animate-subtitle mt-3 font-display text-4xl font-black sm:text-6xl" style={{ color: "var(--text-primary)" }}>Built around the love of sport.</h2>
              <p className="animate-description mt-5 leading-7" style={{ color: "var(--text-secondary)" }}>These image tiles are ready to be replaced with your final LJ sports photographs.</p>
            </div>
            <div className="about-diamond-grid" aria-label="LJ University sports photo gallery">
              {sportsPhotos.map((photo, index) => (
                <button
                  type="button"
                  className={`about-photo-tile animate-image about-photo-tile-${index + 1} ${selectedTile === index ? "is-selected" : ""}`}
                  key={`${photo.alt}-${index}`}
                  onClick={() => setSelectedTile(selectedTile === index ? null : index)}
                  aria-label={`View ${photo.alt}`}
                >
                  <img src={photo.src} alt={photo.alt} />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="about-cta-section section">
          <div className="container">
            <div className="about-cta-card">
              <ScrollReveal direction="up" delay={0}>
                <p className="section-kicker">Your campus. Your game.</p>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.12}>
                <h2 className="mt-4 font-display text-4xl font-black sm:text-6xl">Make your next match count.</h2>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.24}>
                <p className="mx-auto mt-5 max-w-xl leading-7" style={{ color: "rgba(255,255,255,0.8)" }}>Join the community that keeps LJ University moving, competing, and connected.</p>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.36}>
                <Link to="/login" className="btn btn-primary btn-lg mt-8">Join Carpediem <ArrowRight size={18} /></Link>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
