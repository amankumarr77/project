import React from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  Code2,
  Users,
  BarChart3,
  Github,
  Linkedin,
  Twitter,
  Cpu,
  TerminalSquare,
  Monitor,
  Cloud,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: Rocket,
      title: "Launch Fast",
      desc: "Kickstart your coding journey with seamless tracking.",
    },
    {
      icon: Users,
      title: "Grow Together",
      desc: "Collaborate with passionate developers around the world.",
    },
    {
      icon: BarChart3,
      title: "Visualize Progress",
      desc: "Track your growth with beautiful analytics and charts.",
    },
    {
      icon: Code2,
      title: "Showcase Projects",
      desc: "Display your best work & build your personal brand.",
    },
  ];

  const floatingIcons = [Cpu, TerminalSquare, Monitor, Cloud];

  return (
    <div className="w-screen min-h-screen flex flex-col justify-between bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white overflow-hidden relative">

      {/* Floating animated icons (fill empty space visually) */}
      {floatingIcons.map((Icon, i) => (
        <motion.div
          key={i}
          className="absolute opacity-10 text-cyan-300"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 360, 0],
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Icon size={60} />
        </motion.div>
      ))}

      {/* HERO SECTION */}
      <div className="flex flex-col items-center justify-center text-center px-6 mt-20 z-10">
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-6xl md:text-8xl font-extrabold tracking-tight relative"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 drop-shadow-[0_0_25px_rgba(147,197,253,0.8)]">
            CODE HUB
          </span>
          <motion.span
            className="absolute left-0 bottom-0 h-[3px] w-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, delay: 0.4 }}
          />
        </motion.h1>

        <motion.p
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-gray-300 text-lg md:text-2xl mt-6 max-w-2xl"
        >
          Empowering coders to{" "}
          <span className="text-indigo-400 font-semibold">build</span>,{" "}
          <span className="text-cyan-300 font-semibold">learn</span> &{" "}
          <span className="text-purple-300 font-semibold">grow together</span>.
        </motion.p>

        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mt-10 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-10 py-4 rounded-2xl text-lg font-semibold shadow-xl hover:shadow-purple-500/40 transition-all"
        >
          Get Started 🚀
        </motion.button>
      </div>

      {/* Animated tagline between hero & features */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="text-center mt-24 text-xl md:text-2xl text-indigo-300 font-medium tracking-wide z-10"
      >
        Transform your <span className="text-cyan-300">ideas</span> into{" "}
        <span className="text-purple-300">impactful code.</span>
      </motion.div>

      {/* FEATURE SECTION */}
      <div className="mt-12 w-full flex flex-wrap justify-center gap-6 px-6 pb-28 z-10">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.2 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 md:p-6 w-[280px] md:w-[300px] hover:bg-white/20 hover:-translate-y-2 transition-all shadow-lg"
            >
              <Icon className="w-10 h-10 text-indigo-300 mb-3" />
              <h3 className="text-xl font-semibold mb-1">{f.title}</h3>
              <p className="text-gray-300 text-sm">{f.desc}</p>
            </motion.div>
          );
        })}
      </div>

      {/* FOOTER */}
      <footer className="w-full border-t border-white/20 py-6 text-center bg-white/5 backdrop-blur-md mt-auto">
        <div className="flex justify-center gap-8 mb-3">
          <a href="#" className="hover:text-cyan-400 transition-all">
            <Github />
          </a>
          <a href="#" className="hover:text-indigo-400 transition-all">
            <Linkedin />
          </a>
          <a href="#" className="hover:text-purple-400 transition-all">
            <Twitter />
          </a>
        </div>
        <p className="text-sm text-gray-300">
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-indigo-300">CODE HUB</span> — Built
          with 💙 for the developer community.
        </p>
      </footer>
    </div>
  );
}
