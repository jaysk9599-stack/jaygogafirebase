import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { Users, ShoppingCart, TrendingUp, Clock, IndianRupee, Loader2, Package, CheckCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GettingStartedGuide: React.FC = () => {
  const navigate = useNavigate();
  const { products, customers } = useAuth();

  const steps = [
    {
      title: '1. Add Your Products',
      description: 'Create a list of all the dairy items you sell.',
      icon: Package,
      path: '/products',
      completed: products.length > 0,
    },
    {
      title: '2. Add Your Customers',
      description: 'Build your customer list to manage orders.',
      icon: Users,
      path: '/customers',
      completed: customers.length > 0,
    },
    {
      title: '3. Create Your First Order',
      description: 'Once set up, you can start taking orders.',
      icon: ShoppingCart,
      path: '/orders',
      completed: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Getting Started Guide</h3>
      <div className="space-y-3">
        {steps.map((step) => (
          <motion.div
            key={step.title}
            className={`flex items-center p-3 rounded-lg transition-colors cursor-pointer hover:bg-gray-100 ${
              step.completed ? 'bg-green-50' : 'bg-gray-50'
            }`}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(step.path)}
          >
            <div
              className={`p-2 rounded-full mr-4 ${
                step.completed
                  ? 'bg-green-100 text-green-600'
                  : 'bg-dairy-100 text-dairy-600'
              }`}
            >
              {step.completed ? <CheckCircle size={20} /> : <step.icon size={20} />}
            </div>
            <div className="flex-grow">
              <p className="font-medium text-gray-800">{step.title}</p>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
            <ChevronRight className="ml-auto text-gray-400" size={20} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};


const Dashboard: React.FC = () => {
  const { orders, customers, products, dataLoading } = useAuth();

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(order => order.date === today);

  const totalCollectionToday = todayOrders.reduce((sum, order) => sum + (order.amount_paid || 0), 0);
  const totalAmountToday = todayOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalPendingToday = totalAmountToday - totalCollectionToday;

  const stats = [
    {
      icon: TrendingUp,
      label: 'Total Amount',
      value: `₹${totalAmountToday.toFixed(2)}`,
      color: 'bg-purple-100 text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: IndianRupee,
      label: 'Today\'s Collection',
      value: `₹${totalCollectionToday.toFixed(2)}`,
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Clock,
      label: 'Today\'s Pending',
      value: `₹${totalPendingToday.toFixed(2)}`,
      color: 'bg-orange-100 text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: ShoppingCart,
      label: 'Total Orders Today',
      value: todayOrders.length.toString(),
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Users,
      label: 'Total Customers',
      value: customers.length.toString(),
      color: 'bg-pink-100 text-pink-600',
      bgColor: 'bg-pink-50'
    }
  ];

  const productSummary = useMemo(() => {
    const summary: { [productName: string]: { quantity: number } } = {};
    todayOrders.forEach(order => {
        order.items.forEach(item => {
            if (!summary[item.product_name]) {
                summary[item.product_name] = { quantity: 0 };
            }
            summary[item.product_name].quantity += item.quantity;
        });
    });
    return Object.entries(summary).sort((a, b) => b[1].quantity - a[1].quantity);
  }, [todayOrders]);

  const showGettingStarted = !dataLoading && (customers.length === 0 || products.length === 0);

  if (dataLoading) {
    return (
      <Layout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-dairy-600" size={32} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-2">Today's Overview</h2>
          <p className="text-gray-600 text-sm">
            {new Date().toLocaleDateString('en-IN', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.bgColor} p-4 rounded-xl border border-gray-100 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-1 truncate">
                {stat.value}
              </div>
              <div className="text-xs text-gray-600">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {showGettingStarted && <GettingStartedGuide />}

        {productSummary.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Product Summary</h3>
            <div className="space-y-3">
              {productSummary.map(([productName, { quantity }]) => (
                <div key={productName} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-800 text-sm">{productName}</p>
                  <p className="font-semibold text-dairy-700">
                    {quantity}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          !showGettingStarted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center"
            >
              <ShoppingCart className="mx-auto mb-4 text-gray-300" size={48} />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Orders Today</h3>
              <p className="text-gray-600">Start adding orders for today's deliveries</p>
            </motion.div>
          )
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
