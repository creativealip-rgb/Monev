"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkles, Edit2, Check } from "lucide-react";

interface BudgetCategory {
  category: string;
  amount: number;
  percentage: number;
}

interface BudgetSetupProps {
  monthlyIncome: number;
  onComplete: (budgets: BudgetCategory[]) => void;
  onSkip: () => void;
}

export default function BudgetSetup({ monthlyIncome, onComplete, onSkip }: BudgetSetupProps) {
  const [budgets, setBudgets] = useState<BudgetCategory[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");

  useEffect(() => {
    // Generate budget suggestion using 50/30/20 rule
    const needs = [
      { category: "Makanan", percentage: 20 },
      { category: "Transport", percentage: 15 },
      { category: "Tagihan", percentage: 10 },
      { category: "Kesehatan", percentage: 5 },
    ];
    const wants = [
      { category: "Belanja", percentage: 15 },
      { category: "Hiburan", percentage: 10 },
      { category: "Langganan", percentage: 5 },
    ];
    const savings = [
      { category: "Tabungan", percentage: 20 },
    ];

    const allCategories = [...needs, ...wants, ...savings];
    const suggested = allCategories.map((cat) => ({
      category: cat.category,
      percentage: cat.percentage,
      amount: Math.round((monthlyIncome * cat.percentage) / 100),
    }));

    setBudgets(suggested);
  }, [monthlyIncome]);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditAmount(budgets[index].amount.toString());
  };

  const handleSaveEdit = (index: number) => {
    const newAmount = parseInt(editAmount);
    if (!isNaN(newAmount) && newAmount >= 0) {
      const newBudgets = [...budgets];
      newBudgets[index].amount = newAmount;
      newBudgets[index].percentage = Math.round((newAmount / monthlyIncome) * 100);
      setBudgets(newBudgets);
    }
    setEditingIndex(null);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const remaining = monthlyIncome - totalBudget;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              Saran Budget AI
            </h1>
          </div>
          <p className="text-gray-600">
            Berdasarkan penghasilan Rp {monthlyIncome.toLocaleString("id-ID")}/bulan
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Menggunakan aturan 50/30/20 (Kebutuhan/Keinginan/Tabungan)
          </p>
        </div>

        {/* Budget Summary */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Total Budget</span>
            <span className="text-2xl font-bold text-gray-900">
              Rp {totalBudget.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Sisa</span>
            <span className={`text-lg font-semibold ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
              Rp {remaining.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Budget Categories */}
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {budgets.map((budget, index) => (
            <motion.div
              key={budget.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-4 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{budget.category}</p>
                  <p className="text-sm text-gray-500">{budget.percentage}% dari penghasilan</p>
                </div>
                {editingIndex === index ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-32 px-3 py-1 border border-gray-300 rounded-lg text-right"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(index)}
                      className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      Rp {budget.amount.toLocaleString("id-ID")}
                    </span>
                    <button
                      onClick={() => handleEdit(index)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            Lewati
          </button>
          <button
            onClick={() => onComplete(budgets)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Terapkan Budget
          </button>
        </div>
      </motion.div>
    </div>
  );
}
