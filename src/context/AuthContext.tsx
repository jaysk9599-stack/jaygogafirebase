import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updatePassword as fbUpdatePassword,
  sendEmailVerification,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDocs,
  writeBatch,
  Timestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { AppUser, Product, Customer, DailyOrder, OrderItem } from '../types';

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; message?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; message?: string }>;
  authLoading: boolean;
  products: Product[];
  customers: Customer[];
  orders: DailyOrder[];
  dataLoading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  addOrder: (order: Omit<DailyOrder, 'id' | 'user_id' | 'created_at' | 'items'>, items: OrderItem[]) => Promise<void>;
  updateOrder: (orderId: string, updates: Partial<DailyOrder>) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<DailyOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        if (firebaseUser.emailVerified) {
          const profileDoc = await getDoc(doc(db, 'profiles', firebaseUser.uid));
          const username = profileDoc.exists() ? profileDoc.data().username : firebaseUser.email;
          setUser({ id: firebaseUser.uid, email: firebaseUser.email || '', username: username || '' });
        } else {
          setUser(null); // User is not verified, treat as logged out
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      setProducts([]);
      setCustomers([]);
      setOrders([]);
      return;
    }

    setDataLoading(true);
    setError(null);

    const productsQuery = query(collection(db, 'products'), where('user_id', '==', user.id));
    const customersQuery = query(collection(db, 'customers'), where('user_id', '==', user.id));
    const ordersQuery = query(collection(db, 'daily_orders'), where('user_id', '==', user.id));

    const unsubProducts = onSnapshot(productsQuery, snapshot => {
      const productsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(productsData.sort((a,b) => (a.created_at as any) - (b.created_at as any)));
    }, err => { setError(err.message); console.error(err); });

    const unsubCustomers = onSnapshot(customersQuery, snapshot => {
      const customersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
      setCustomers(customersData.sort((a,b) => (a.created_at as any) - (b.created_at as any)));
    }, err => { setError(err.message); console.error(err); });

    const unsubOrders = onSnapshot(ordersQuery, snapshot => {
      const ordersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DailyOrder));
      setOrders(ordersData.sort((a,b) => (b.date as any).localeCompare(a.date) || (b.created_at as any) - (a.created_at as any)));
      setDataLoading(false); // Set loading to false after the main data is fetched
    }, err => { setError(err.message); console.error(err); setDataLoading(false); });

    return () => {
      unsubProducts();
      unsubCustomers();
      unsubOrders();
    };
  }, [user]);

  const handleAuthError = (error: any): string => {
    switch (error.code) {
      case 'auth/invalid-email': return 'Invalid email format.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return 'Invalid login credentials';
      case 'auth/email-already-in-use': return 'An account with this email already exists.';
      case 'auth/weak-password': return 'Password should be at least 6 characters.';
      default: return error.message || 'An unknown error occurred.';
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        return { success: false, message: 'Email not confirmed' };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, message: handleAuthError(error) };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, username: string, password: string) => {
    setAuthLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await setDoc(doc(db, 'profiles', userCredential.user.uid), {
          username,
          email,
          created_at: Timestamp.now(),
      });
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: handleAuthError(error) };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthLoading(true);
    await signOut(auth);
    setUser(null);
    setAuthLoading(false);
  }, []);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    setAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, { url: `${window.location.origin}/update-password` });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: handleAuthError(error) };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const resendVerificationEmail = useCallback(async (email: string) => {
    // This is tricky as Firebase doesn't have a direct "resend" for an arbitrary email.
    // We'll simulate it by trying to send a password reset, which confirms if the user exists.
    setAuthLoading(true);
    try {
      // A bit of a hack: if this succeeds, the user exists. We can't directly resend verification
      // without the user object, so we guide them to re-register or check spam.
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: "If an account exists for this email, a password reset link has been sent. Please also check your original verification email (including spam folder)." };
    } catch (error: any) {
      return { success: false, message: "Could not process request. Please ensure the email is correct." };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    setAuthLoading(true);
    if (!auth.currentUser) return { success: false, message: "Not authenticated" };
    try {
      await fbUpdatePassword(auth.currentUser, password);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: handleAuthError(error) };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) throw new Error("User not authenticated");
    await addDoc(collection(db, 'products'), { ...product, user_id: user.id, created_at: Timestamp.now() });
  }, [user]);

  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    await updateDoc(doc(db, 'products', productId), updates);
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    await deleteDoc(doc(db, 'products', productId));
  }, []);

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) throw new Error("User not authenticated");
    await addDoc(collection(db, 'customers'), { ...customer, user_id: user.id, created_at: Timestamp.now() });
  }, [user]);

  const updateCustomer = useCallback(async (customerId: string, updates: Partial<Customer>) => {
    await updateDoc(doc(db, 'customers', customerId), updates);
  }, []);

  const deleteCustomer = useCallback(async (customerId: string) => {
    if (!user) throw new Error("User not authenticated");
    const batch = writeBatch(db);
    const ordersQuery = query(collection(db, 'daily_orders'), where('user_id', '==', user.id), where('customer_id', '==', customerId));
    const ordersSnapshot = await getDocs(ordersQuery);
    ordersSnapshot.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'customers', customerId));
    await batch.commit();
  }, [user]);

  const addOrder = useCallback(async (order: Omit<DailyOrder, 'id' | 'user_id' | 'created_at' | 'items'>, items: OrderItem[]) => {
    if (!user) throw new Error("User not authenticated");
    await addDoc(collection(db, 'daily_orders'), { ...order, items, user_id: user.id, created_at: Timestamp.now() });
  }, [user]);

  const updateOrder = useCallback(async (orderId: string, updates: Partial<DailyOrder>) => {
    await updateDoc(doc(db, 'daily_orders', orderId), updates);
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    await deleteDoc(doc(db, 'daily_orders', orderId));
  }, []);

  const value = useMemo(() => ({
    user, login, register, logout, authLoading, sendPasswordResetEmail, resendVerificationEmail, updatePassword,
    products, customers, orders, dataLoading, error,
    addProduct, updateProduct, deleteProduct,
    addCustomer, updateCustomer, deleteCustomer,
    addOrder, updateOrder, deleteOrder,
  }), [
    user, login, register, logout, authLoading, sendPasswordResetEmail, resendVerificationEmail, updatePassword,
    products, customers, orders, dataLoading, error,
    addProduct, updateProduct, deleteProduct,
    addCustomer, updateCustomer, deleteCustomer,
    addOrder, updateOrder, deleteOrder,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
