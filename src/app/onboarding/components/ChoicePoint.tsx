"use client";

import { motion } from "framer-motion";
import { Zap, Target } from "lucide-react";

interface ChoicePointProps {
  onSelectPath: (path: "quick" | "complete") => void;
}

export default function ChoicePoint({ onSelectPath }: ChoicePointProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pilih Jalur Setup
        </h1>
        <p className="text-gray-600">
          Sesuaikan pengalaman onboarding dengan kebutuhan kamu
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Quick Path */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => onSelectPath("quick")}
          className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500 text-left group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <Zap className="w-6 h-6 text-blue-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Quick Start</h3>
              <p className="text-sm text-gray-500">~2 menit</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">✓</span>
              <span>Setup dasar dengan data demo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">✓</span>
              <span>Langsung lihat dashboard terisi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">✓</span>
              <span>Saran budget otomatis</span>
            </li>
          </ul>
        </motion.button>

        {/* Complete Path */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onSelectPath("complete")}
          className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-indigo-500 text-left group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
              <Target className="w-6 h-6 text-indigo-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Complete Setup</h3>
              <p className="text-sm text-gray-500">~5 menit</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">✓</span>
              <span>Setup akun bank & e-wallet</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">✓</span>
              <span>Pilih data demo atau mulai kosong</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">✓</span>
              <span>Kustomisasi budget & kategori</span>
            </li>
          </ul>
        </motion.button>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-gray-500 mt-6 text-center"
      >
        Kamu bisa ubah pengaturan ini kapan saja di dashboard
      </motion.p>
    </div>
  );
}
