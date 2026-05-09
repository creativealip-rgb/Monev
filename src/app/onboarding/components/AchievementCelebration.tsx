"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Trophy, Share2, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

interface Achievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  points: number;
}

interface AchievementCelebrationProps {
  achievement: Achievement;
  onContinue: () => void;
}

export default function AchievementCelebration({ achievement, onContinue }: AchievementCelebrationProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Trigger confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Animate progress bar
    setTimeout(() => {
      setProgress(100);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const tierColors = {
    bronze: "from-amber-600 to-amber-800",
    silver: "from-gray-400 to-gray-600",
    gold: "from-yellow-400 to-yellow-600",
    platinum: "from-cyan-400 to-blue-600",
  };

  const tierColor = tierColors[achievement.tier.toLowerCase() as keyof typeof tierColors] || tierColors.bronze;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="w-full max-w-md"
      >
        {/* Achievement Badge */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br ${tierColor} flex items-center justify-center shadow-2xl`}
          >
            <span className="text-6xl">{achievement.icon}</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="inline-block px-4 py-1 bg-white rounded-full shadow-md mb-3">
              <span className="text-sm font-semibold text-gray-600 uppercase">
                {achievement.tier}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {achievement.name}
            </h1>
            <p className="text-gray-600 mb-4">
              {achievement.description}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">
                +{achievement.points} poin
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-lg mb-6"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className="text-sm font-bold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
            />
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="space-y-3"
        >
          <button
            onClick={onContinue}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            Lanjutkan
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              // TODO: Implement share functionality
              alert("Share feature coming soon!");
            }}
            className="w-full bg-white text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 border-2 border-gray-200"
          >
            <Share2 className="w-5 h-5" />
            Bagikan Achievement
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
