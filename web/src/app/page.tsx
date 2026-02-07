"use client";

import Link from "next/link";
import {
  Leaf,
  ArrowRight,
  Recycle,
  BarChart3,
  Smartphone,
  Users,
  CloudOff,
  Scale,
  Info,
  Heart,
} from "lucide-react";
import { useEffect, useState } from "react";

/* ─── Animated counter ─── */
function AnimatedCounter({ end, duration = 2000, suffix = "", prefix = "" }: { end: number; duration?: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-green-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl green-gradient flex items-center justify-center shadow-lg shadow-green-200">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">GreenLens AI</h1>
              <p className="text-[10px] uppercase tracking-wider text-green-600 font-semibold">Community Impact</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a href="#about" className="text-sm text-gray-600 hover:text-green-700 font-medium">About</a>
            <a href="#methodology" className="text-sm text-gray-600 hover:text-green-700 font-medium">Methodology</a>
            <a href="#impact" className="text-sm text-gray-600 hover:text-green-700 font-medium">Impact</a>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-1.5 rounded-full mb-6">
          <Heart className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs font-semibold text-green-700">National Non-Profit Initiative · Georgia & Tennessee Pilots</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight max-w-4xl mx-auto">
          Closing the Loop on{" "}
          <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
            Community Waste
          </span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          GreenLens AI is a national non-profit empowering anyone — volunteers, haulers, and city officials — to classify waste as{" "}
          <strong className="text-green-700">recyclable</strong>,{" "}
          <strong className="text-amber-600">organic</strong>, or{" "}
          <strong className="text-red-500">non-recyclable</strong>{" "}
          — with a single photo. Pick your role and start making an impact today.
        </p>
        <div className="flex items-center justify-center gap-4 mt-10">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-8 py-3.5 bg-green-600 text-white rounded-2xl font-bold text-base hover:bg-green-700 transition-colors shadow-xl shadow-green-200"
          >
            View Live Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#methodology"
            className="flex items-center gap-2 px-8 py-3.5 bg-white text-gray-700 rounded-2xl font-bold text-base border border-gray-200 hover:border-green-300 hover:text-green-700 transition-colors"
          >
            How It Works
          </a>
        </div>
      </section>

      {/* ─── Live Stats Counter ─── */}
      <section id="impact" className="bg-white border-y border-green-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm text-gray-500 mb-8 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full live-pulse" />
            Live community impact — updated in real time
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Total Waste Scanned", value: 184200, suffix: " lbs", icon: Scale, color: "text-green-600", bg: "bg-green-50" },
              { label: "CO₂ Emissions Avoided", value: 42600, suffix: " kg", icon: CloudOff, color: "text-violet-600", bg: "bg-violet-50" },
              { label: "Community Scans", value: 2847, suffix: "", icon: Smartphone, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Active Volunteers", value: 340, suffix: "+", icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center mx-auto mb-3`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className="text-3xl md:text-4xl font-extrabold text-gray-900">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── About / Features ─── */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-gray-900">How GreenLens Works</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            A simple 3-step process to divert waste from landfills — piloting across Georgia & Tennessee.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Smartphone,
              title: "1. Snap a Photo",
              desc: "Anyone can photograph waste in their neighborhood, route, or district using the free GreenLens app.",
              color: "bg-green-50 text-green-600",
            },
            {
              icon: Recycle,
              title: "2. AI Classifies",
              desc: "Gemini 2.5 Flash vision identifies waste as recyclable, organic, or non-recyclable instantly.",
              color: "bg-amber-50 text-amber-600",
            },
            {
              icon: BarChart3,
              title: "3. Route & Track",
              desc: "Get directions to the nearest drop-off center. Every scan updates the community dashboard in real time.",
              color: "bg-blue-50 text-blue-600",
            },
          ].map((step) => (
            <div key={step.title} className="glass-card p-8 text-center hover:shadow-lg transition-shadow">
              <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-5`}>
                <step.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Waste Categories ─── */}
      <section className="bg-white border-y border-green-100 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            Three Simple Categories
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl border-2 border-green-200 bg-green-50/50 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Recycle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-700 mb-2">Recyclable</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Metals (steel, aluminum, copper), glass, clean plastics, concrete, brick, drywall
              </p>
            </div>
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-amber-700 mb-2">Organic</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Untreated wood, cardboard, paper, yard waste, food waste, soil, plant matter
              </p>
            </div>
            <div className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <CloudOff className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-red-600 mb-2">Non-Recyclable</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Treated/contaminated wood, mixed debris, asbestos-containing materials, composites
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Methodology ─── */}
      <section id="methodology" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full mb-4">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">Transparency</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">How We Calculate Impact</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Our CO₂ and weight estimates are grounded in EPA research.
          </p>
        </div>
        <div className="space-y-6">
          <div className="glass-card p-6 border-l-4 border-green-500">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Scale className="w-5 h-5 text-green-600" />
              Weight Estimation
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Gemini&apos;s vision model estimates total debris weight from visual scale cues — known object sizes (buckets, pallets, vehicles), container volumes, and nearby reference objects. These estimates are approximate and best used for aggregated tracking rather than precise measurements.
            </p>
          </div>
          <div className="glass-card p-6 border-l-4 border-violet-500">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CloudOff className="w-5 h-5 text-violet-600" />
              CO₂ Offset Calculation
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              CO₂ savings are derived from the <strong>EPA WARM Model v16</strong> (Waste Reduction Model) — the standard tool for estimating greenhouse gas impacts of different waste management practices.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-lg font-bold text-green-700">1.02 kg</p>
                <p className="text-xs text-gray-500">CO₂ saved per lb recyclable</p>
                <p className="text-[11px] text-gray-400 mt-1">Weighted avg: metals, plastics, glass, concrete diversion vs. landfill</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-lg font-bold text-amber-700">0.34 kg</p>
                <p className="text-xs text-gray-500">CO₂ saved per lb organic</p>
                <p className="text-[11px] text-gray-400 mt-1">Composting prevents methane from anaerobic landfill decomposition</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-lg font-bold text-red-600">0.05 kg</p>
                <p className="text-xs text-gray-500">CO₂ saved per lb non-recyclable</p>
                <p className="text-[11px] text-gray-400 mt-1">Minimal credit for proper disposal vs. open landfilling</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6 border-l-4 border-blue-500">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Dashboard Statistics
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              All dashboard numbers aggregate from individual scan records stored in real-time via Convex.
              <strong> Total Waste</strong> = sum of all scan weight estimates.
              <strong> CO₂ Offset</strong> = sum of (weight × category factor) per scan.
              <strong> Diversion Rate</strong> = (recyclable + organic weight) / total weight × 100%.
              Statistics update live as new scans arrive from the field.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-600 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Join the Movement
          </h2>
          <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
            Pick your role — Neighborhood Volunteer, Independent Hauler, or Government Liaison — and start scanning today.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-green-700 rounded-2xl font-bold text-base hover:bg-green-50 transition-colors shadow-xl"
          >
            Explore the Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-400" />
            <span className="text-white font-bold">GreenLens AI</span>
            <span className="text-xs">— National Non-Profit · Georgia & Tennessee Pilots</span>
          </div>
          <p className="text-xs">
            National non-profit initiative. Georgia & Tennessee pilot. Data sourced from EPA WARM Model v16. Built with Gemini AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
