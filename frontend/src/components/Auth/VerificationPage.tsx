import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
  Brain,
  RefreshCw,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  verifySignupCode,
  resendVerificationCode,
} from "../../services/verificationService";
import { useAuthStore } from "../../store/authStore";

export const VerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  // Get email from location state or redirect to signin
  const email = location.state?.email;
  const verificationType = location.state?.type || "signup";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);

  // Redirect if already signed in or no email
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (!email) {
      navigate("/signin", { replace: true });
      return;
    }
  }, [user, email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) return; // Only allow single digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all fields are filled
    if (newCode.every((digit) => digit) && newCode.join("").length === 6) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join("");

    if (codeToVerify.length !== 6) {
      return;
    }

    setLoading(true);

    try {
      if (verificationType === "signup") {
        await verifySignupCode(email, codeToVerify);
        navigate("/dashboard");
      }
      // Add other verification types here if needed
    } catch (error) {
      console.error("Verification failed:", error);
      // Reset code inputs on error
      setCode(["", "", "", "", "", ""]);
      const firstInput = document.getElementById("code-input-0");
      firstInput?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);

    try {
      await resendVerificationCode(email, verificationType);
      setTimeLeft(600); // Reset timer to 10 minutes
      setCanResend(false);
    } catch (error) {
      console.error("Resend failed:", error);
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (!email) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-brand-500 to-accent-500 p-2.5 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-200"
            >
              <Brain className="h-6 w-6 text-white" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              CourseAI
            </span>
          </Link>

          <Link
            to="/signin"
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to Sign In</span>
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-screen px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft-lg border border-gray-200 dark:border-gray-800">
            {/* Icon */}
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-brand-100 to-accent-100 dark:from-brand-900/30 dark:to-accent-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-brand-600 dark:text-brand-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verify Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                We've sent a 6-digit code to
              </p>
              <p className="text-brand-600 dark:text-brand-400 font-medium">
                {email}
              </p>
            </div>

            {/* Code Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                Enter Verification Code
              </label>
              <div className="flex justify-center space-x-3">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-input-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    aria-label={`Verification digit ${index + 1}`}
                    onChange={(e) => handleCodeChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    disabled={loading}
                    className="w-12 h-12 text-center text-xl font-bold border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="text-center mb-6">
              {timeLeft > 0 ? (
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>Code expires in {formatTime(timeLeft)}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>Code has expired</span>
                </div>
              )}
            </div>

            {/* Verify Button */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              onClick={() => handleVerify()}
              disabled={loading || code.some((digit) => !digit)}
              className="w-full bg-gradient-to-r from-brand-500 to-accent-500 text-white py-3.5 rounded-xl font-semibold hover:from-brand-600 hover:to-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mb-4"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Check className="h-5 w-5" />
                  <span>Verify Email</span>
                </div>
              )}
            </motion.button>

            {/* Resend Button */}
            <motion.button
              whileHover={{ scale: !canResend || resendLoading ? 1 : 1.02 }}
              whileTap={{ scale: !canResend || resendLoading ? 1 : 0.98 }}
              onClick={handleResend}
              disabled={!canResend || resendLoading}
              className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3.5 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="h-5 w-5" />
                  <span>Resend Code</span>
                </div>
              )}
            </motion.button>

            {/* Help Text */}
            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>
                Didn't receive the code? Check your spam folder or try
                resending.
              </p>
              <p className="mt-2">
                Having trouble?{" "}
                <Link
                  to="/support"
                  className="text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
