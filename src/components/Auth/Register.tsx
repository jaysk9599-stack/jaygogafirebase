import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, Loader2, ArrowLeft, Check, X } from 'lucide-react';

interface RegisterProps {
  onToggleMode: () => void;
}

const PasswordRequirement: React.FC<{ isValid: boolean; text: string }> = ({ isValid, text }) => (
  <li className={`flex items-center text-sm ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
    {isValid ? <Check size={16} className="mr-2" /> : <X size={16} className="mr-2 text-red-400" />}
    {text}
  </li>
);

const Register: React.FC<RegisterProps> = ({ onToggleMode }) => {
  const { register, authLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  const [validation, setValidation] = useState({
    minLength: false,
    hasUpper: false,
    hasNumber: false,
    passwordsMatch: false,
  });

  useEffect(() => {
    const { password, confirmPassword } = formData;
    setValidation({
      minLength: password.length >= 6,
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      passwordsMatch: password !== '' && password === confirmPassword,
    });
  }, [formData.password, formData.confirmPassword]);

  const allValid = validation.minLength && validation.hasUpper && validation.hasNumber && validation.passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!allValid) {
      setError('Please ensure all password requirements are met.');
      return;
    }
    
    const result = await register(formData.email, formData.username, formData.password);
    if (!result.success) {
      setError(result.message || 'An unknown error occurred during registration.');
    } else {
      setIsRegistered(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isRegistered) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white rounded-xl shadow-lg p-8 text-center"
      >
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Registration Successful!</h2>
        <p className="text-gray-600 mt-2 mb-6">
          Please check your email at <strong>{formData.email}</strong> to verify your account before signing in.
        </p>
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
        <h2 className="text-2xl font-bold text-gray-800">Create an Account</h2>
        <p className="text-gray-500 mt-2">Join to start managing your dairy business.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg" placeholder="e.g., Ramesh Bhai" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg" placeholder="you@example.com" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg" placeholder="Create a password" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <ul className="space-y-1 pl-1">
            <PasswordRequirement isValid={validation.minLength} text="At least 6 characters" />
            <PasswordRequirement isValid={validation.hasUpper} text="Contains an uppercase letter" />
            <PasswordRequirement isValid={validation.hasNumber} text="Contains a number" />
        </ul>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`w-full pl-10 pr-12 py-3 border rounded-lg transition-colors ${!validation.passwordsMatch && formData.confirmPassword ? 'border-red-500' : 'border-gray-300'}`} placeholder="Confirm your password" required />
             <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
           {!validation.passwordsMatch && formData.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">Passwords do not match.</p>
          )}
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center">
            {error}
          </motion.div>
        )}

        <motion.button
          type="submit"
          disabled={authLoading || !allValid}
          className="w-full bg-dairy-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-dairy-700 transition-colors disabled:opacity-50 flex justify-center items-center shadow-lg shadow-dairy-500/20"
          whileTap={{ scale: 0.98 }}
        >
          {authLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
        </motion.button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button onClick={onToggleMode} className="text-dairy-600 hover:text-dairy-700 font-medium">
            Sign In
          </button>
        </p>
      </div>
    </motion.div>
  );
};

export default Register;
