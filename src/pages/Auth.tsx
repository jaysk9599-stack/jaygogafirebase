import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';
import ForgotPassword from '../components/Auth/ForgotPassword';
import { Milk } from 'lucide-react';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgotPassword'>('login');

  const renderContent = () => {
    switch (mode) {
      case 'login':
        return <Login onToggleMode={() => setMode('register')} onForgotPassword={() => setMode('forgotPassword')} />;
      case 'register':
        return <Register onToggleMode={() => setMode('login')} />;
      case 'forgotPassword':
        return <ForgotPassword onToggleMode={() => setMode('login')} />;
      default:
        return <Login onToggleMode={() => setMode('register')} onForgotPassword={() => setMode('forgotPassword')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dairy-50 to-dairy-100 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-white rounded-full shadow-md mb-4">
          <Milk className="w-12 h-12 text-dairy-600" />
        </div>
        <h1 className="text-3xl font-bold text-dairy-800">Jay Goga Milk</h1>
      </div>
      <div className="w-full max-w-md">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
