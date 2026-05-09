"use client";

import { motion } from "framer-motion";
import { Calendar, TrendingUp, CheckCircle } from "lucide-react";

interface DemoDataMatrixProps {
  onSelect: (scope: "quick" | "standard" | "complete" | null) => void;
}

const templates = [
  {
    scope: "quick" as const,
    title: "Quick Start",
    duration: "1 Minggu",
    transactions: "15 transaksi",
    features: ["2 akun", "1 budget", "Data sederhana"],
    color: "blue",
    icon: "⚡",
  },
  {
    scope: "standard" as const,
    title: "Standard",
    duration: "1 Bulan",
    transactions: "30 transaksi",
    features: ["3 akun", "3 budget", "2 tagihan"],
    color: "indigo",
    icon: "📊",
  },
  {
    scope: "complete" as const,
    title: "Complete",
    duration: "3 Bulan",
    transactions: "50+ transaksi",
    features: ["5 akun", "Budget lengkap", "Goals & recurring"],
    color: "purple",
    icon: "🚀",
  },
];

export default function DemoDataMatrix({ onSelect }: DemoDataMatrixProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pilih Data Demo
          </h1>
          <p className="text-gray-600">
            Lihat dashboard terisi dengan data realistis untuk eksplorasi fitur
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {templates.map((template, index) => (
            <motion.button
              key={template.scope}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(template.scope)}
              className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-${template.color}-500 text-left group`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">{template.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{template.title}</h3>
                  <p className="text-sm text-gray-500">{template.duration}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{template.transactions}</span>
              </div>

              <ul className="space-y-2">
                {template.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className={`w-4 h-4 text-${template.color}-500 mt-0.5 flex-shrink-0`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className={`mt-4 pt-4 border-t border-gray-100 text-center text-sm font-semibold text-${template.color}-600 group-hover:text-${template.color}-700`}>
                Pilih Template Ini
              </div>
            </motion.button>
          ))}
        </div>

        {/* Skip Option */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={() => onSelect(null)}
            className="text-gray-600 hover:text-gray-900 font-semibold underline"
          >
            Lewati, mulai dengan data kosong
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-blue-50 rounded-xl p-4 flex items-start gap-3"
        >
          <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-1">💡 Tips:</p>
            <p>Data demo membantu kamu memahami fitur Monev lebih cepat. Kamu bisa hapus atau ganti dengan data asli kapan saja.</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
