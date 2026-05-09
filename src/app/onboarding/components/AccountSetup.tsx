"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Wallet, CreditCard, Plus, X } from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: "bank" | "ewallet" | "cash";
  balance: number;
}

interface AccountSetupProps {
  onComplete: (accounts: Account[]) => void;
  onSkip: () => void;
}

export default function AccountSetup({ onComplete, onSkip }: AccountSetupProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "bank" as "bank" | "ewallet" | "cash",
    balance: "",
  });

  const handleAddAccount = () => {
    if (!formData.name || !formData.balance) return;

    const newAccount: Account = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      balance: parseFloat(formData.balance),
    };

    setAccounts([...accounts, newAccount]);
    setFormData({ name: "", type: "bank", balance: "" });
    setShowForm(false);
  };

  const handleRemoveAccount = (id: string) => {
    setAccounts(accounts.filter((acc) => acc.id !== id));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Setup Akun Keuangan
          </h1>
          <p className="text-gray-600">
            Tambahkan akun bank, e-wallet, atau cash yang kamu gunakan
          </p>
        </div>

        {/* Account List */}
        <div className="space-y-3 mb-6">
          {accounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-4 shadow-md flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  {account.type === "bank" && <CreditCard className="w-5 h-5 text-blue-600" />}
                  {account.type === "ewallet" && <Wallet className="w-5 h-5 text-blue-600" />}
                  {account.type === "cash" && <span className="text-blue-600 font-bold">💵</span>}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{account.name}</p>
                  <p className="text-sm text-gray-500">
                    Rp {account.balance.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveAccount(account.id)}
                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Add Account Form */}
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg mb-6"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Tambah Akun Baru</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Akun
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: BCA, GoPay, Cash"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Akun
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="bank">Bank</option>
                  <option value="ewallet">E-Wallet</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Awal
                </label>
                <input
                  type="number"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddAccount}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Tambah
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 font-semibold mb-6"
          >
            <Plus className="w-5 h-5" />
            Tambah Akun
          </button>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            Lewati
          </button>
          <button
            onClick={() => onComplete(accounts)}
            disabled={accounts.length === 0}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Lanjut ({accounts.length})
          </button>
        </div>
      </motion.div>
    </div>
  );
}
