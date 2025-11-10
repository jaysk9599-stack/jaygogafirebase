import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, MailCheck } from 'lucide-react';

interface ForgotPasswordProps {
  onToggleMode: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onToggleMode }) => {
  const { sendPasswordResetEmail, authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await sendPasswordResetEmail(email);
    if (!result.success) {
      setError(result.message || 'Failed to send reset link. Please try again.');
    } else {
      setIsSent(true);
    }
  };

  if (isSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white rounded-xl shadow-lg p-8 text-center"
      >
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <MailCheck className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Check Your Inbox</h2>
        <p className="text-gray-600 mt-2 mb-6">
          A password reset link has been sent to <strong>{email}</strong>.
        </p>
        <div className="text-left bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-2 mb-6">
            <h3 className="font-semibold">Next Steps:</h3>
            <p>1. Go to your email inbox.</p>
            <p>2. Find the email from us (check spam if needed).</p>
            <p>3. Click the link inside to create a new password.</p>
        </div>
        <motion.button
          onClick={onToggleMode}
          className="w-full bg-dairy-600 text-white py-3 rounded-lg font-semibold hover:bg-dairy-700 transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="inline-block mr-2" size={16} />
          Back to Sign In
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white rounded-xl shadow-lg p-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Forgot Password?</h2>
        <p className="text-gray-500 mt-2">No worries, we'll send you reset instructions.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent transition"
              placeholder="Enter your registered email"
              required
            />
          </div>
        </div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <motion.button
          type="submit"
          disabled={authLoading}
          className="w-full bg-dairy-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-dairy-700 transition-colors disabled:opacity-50 flex justify-center items-center shadow-lg shadow-dairy-500/20"
          whileTap={{ scale: 0.98 }}
        >
          {authLoading ? <Loader2 className="animate-spin" /> : 'Send Reset Link'}
        </motion.button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onToggleMode}
          className="text-dairy-600 hover:text-dairy-700 text-sm font-medium"
        >
          <ArrowLeft className="inline-block mr-1" size={14} /> Back to Sign In
        </button>
      </div>
    </motion.div>
  );
};

export default ForgotPassword;
