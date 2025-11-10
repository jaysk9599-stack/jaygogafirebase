import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';

interface LoginProps {
  onToggleMode: () => void;
  onForgotPassword: () => void;
}

const LoginFailedState: React.FC<{ onTryAgain: () => void; onReset: () => void }> = ({ onTryAgain, onReset }) => (
    <motion.div
        key="login-failed"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-red-50 border-2 border-dashed border-red-200 rounded-xl p-8 text-center"
    >
        <ShieldAlert className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h3 className="text-2xl font-bold text-red-800">Login Failed</h3>
        <p className="text-red-700 mt-2 mb-8">The email or password you entered is incorrect.</p>
        <div className="space-y-3">
            <motion.button
                onClick={onReset}
                className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                whileTap={{ scale: 0.98 }}
            >
                Reset Password
            </motion.button>
            <motion.button
                onClick={onTryAgain}
                className="w-full bg-transparent text-red-700 font-semibold py-3 rounded-lg hover:bg-red-100 transition-colors"
                whileTap={{ scale: 0.98 }}
            >
                Try Again
            </motion.button>
        </div>
    </motion.div>
);

const Login: React.FC<LoginProps> = ({ onToggleMode, onForgotPassword }) => {
  const { login, authLoading, resendVerificationEmail } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'credentials' | 'verification' | 'other' | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorType(null);
    setResendStatus(null);
    
    const result = await login(formData.email, formData.password);
    if (!result.success) {
      if (result.message === 'Email not confirmed') {
        setError('Your email is not verified. Please check your inbox for a verification link.');
        setErrorType('verification');
      } else if (result.message === 'Invalid login credentials') {
        setError('Incorrect email or password. Please try again.');
        setErrorType('credentials');
      } else {
        setError(result.message || 'An unexpected error occurred. Please try again.');
        setErrorType('other');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendStatus(null);
    const result = await resendVerificationEmail(formData.email);
    if (result.success) {
      setResendStatus({ type: 'success', message: 'A new verification link has been sent!' });
    } else {
      setResendStatus({ type: 'error', message: result.message || 'Failed to resend link.' });
    }
    setIsResending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white rounded-xl shadow-lg p-8"
    >
      <AnimatePresence mode="wait">
        {errorType === 'credentials' ? (
          <LoginFailedState
            onTryAgain={() => {
              setError('');
              setErrorType(null);
            }}
            onReset={onForgotPassword}
          />
        ) : (
          <motion.div 
            key="login-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
              <p className="text-gray-500 mt-2">Sign in to manage your dairy business</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent transition" placeholder="you@example.com" required />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button type="button" onClick={onForgotPassword} className="text-sm text-dairy-600 hover:text-dairy-700 font-medium">Forgot Password?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dairy-500 focus:border-transparent transition" placeholder="Enter your password" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && errorType !== 'credentials' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="text-red-700 text-sm bg-red-50 p-3 rounded-lg border border-red-200 flex flex-col items-center space-y-3">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        <p className="text-center">{error}</p>
                      </div>
                      {errorType === 'verification' && (
                        <div className="w-full text-center">
                          <motion.button type="button" onClick={handleResendVerification} disabled={isResending || authLoading} className="mt-2 text-sm font-medium text-blue-600 hover:underline disabled:opacity-50" whileTap={{ scale: 0.98 }}>
                            {isResending ? 'Sending...' : 'Resend verification link'}
                          </motion.button>
                          {resendStatus && (
                            <p className={`mt-1 text-xs ${resendStatus.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                              {resendStatus.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button type="submit" disabled={authLoading} className="w-full bg-dairy-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-dairy-700 transition-colors disabled:opacity-50 flex justify-center items-center shadow-lg shadow-dairy-500/20" whileTap={{ scale: 0.98 }}>
                {authLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button onClick={onToggleMode} className="text-dairy-600 hover:text-dairy-700 font-medium">Sign Up</button>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Login;
