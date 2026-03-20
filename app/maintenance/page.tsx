"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Clock,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function MaintenancePage() {
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [isBypassing, setIsBypassing] = useState(false);

  useEffect(() => {
    // Set estimated time to 2 hours from now
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    setEstimatedTime(
      twoHoursFromNow.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  }, []);

  const handleBypass = async () => {
    setIsBypassing(true);
    try {
      const response = await fetch("/api/auth/maintenance-bypass", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Reload to let middleware redirect properly
        window.location.href = "/dashboard";
      } else {
        console.error("Failed to bypass maintenance mode");
        setIsBypassing(false);
      }
    } catch (error) {
      console.error("Error bypassing maintenance mode:", error);
      setIsBypassing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Animated Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#00B9A7] to-[#0099A0] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00B9A7]/20">
            <Settings className="w-10 h-10 text-white animate-spin-slow" />
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 text-center"
        >
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-[#1A1A2E] dark:text-white mb-3"
          >
            System Maintenance
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[#6B7280] dark:text-gray-400 mb-6 leading-relaxed"
          >
            We&apos;re performing scheduled maintenance to improve your
            experience. SonaMoney will be back shortly.
          </motion.p>

          {/* Status Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-3 mb-8"
          >
            {/* Estimated Time */}
            <div className="flex items-center justify-center gap-3 bg-[#E6F7F6] dark:bg-[#00B9A7]/10 rounded-xl p-4">
              <Clock className="w-5 h-5 text-[#00B9A7]" />
              <span className="text-[#00B9A7] font-semibold">
                Estimated completion: {estimatedTime || "--:--"}
              </span>
            </div>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 text-sm text-[#6B7280] dark:text-gray-500">
              <ShieldCheck className="w-4 h-4" />
              <span>Your data is secure</span>
            </div>
          </motion.div>

          {/* Progress Bar Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#00B9A7] to-[#0099A0] rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: ["0%", "70%", "60%", "85%", "75%"] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
            <p className="text-xs text-[#6B7280] dark:text-gray-500 mt-2">
              Maintenance in progress...
            </p>
          </motion.div>

          {/* Admin Bypass Button (Hidden in plain sight) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="pt-4 border-t border-gray-100 dark:border-gray-800"
          >
            <button
              onClick={handleBypass}
              disabled={isBypassing}
              className="group flex items-center justify-center gap-2 mx-auto text-sm text-[#6B7280] dark:text-gray-500 hover:text-[#00B9A7] dark:hover:text-[#00B9A7] transition-colors duration-200 disabled:opacity-50"
            >
              {isBypassing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying access...</span>
                </>
              ) : (
                <>
                  <span>Admin Access</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
              Authorized personnel only
            </p>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-sm text-[#6B7280] dark:text-gray-500 mt-6"
        >
          Need help? Contact{" "}
          <a
            href="mailto:support@sonamoney.my.id"
            className="text-[#00B9A7] hover:underline"
          >
            support@sonamoney.my.id
          </a>
        </motion.p>
      </div>
    </div>
  );
}
