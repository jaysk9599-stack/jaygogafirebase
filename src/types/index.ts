import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  username: string;
}

// Corresponds to the 'profiles' collection
export interface Profile {
  id: string; // Document ID, same as auth user UID
  username: string;
  email: string;
  created_at: Timestamp;
}

// Corresponds to the 'products' collection
export interface Product {
  id: string;
  user_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: Unit;
  photo?: string;
  created_at: Timestamp;
}

// Corresponds to the 'customers' collection
export interface Customer {
  id: string;
  user_id: string;
  name: string;
  address: string;
  contact_number: string;
  created_at: Timestamp;
}

// Represents an item within the 'items' array of a DailyOrder
export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: Unit;
  price: number;
  total: number;
}

// Corresponds to the 'daily_orders' collection
export interface DailyOrder {
  id: string;
  user_id: string;
  customer_id: string;
  customer_name: string;
  date: string; // Stored as YYYY-MM-DD string
  items: OrderItem[]; // This is an array of objects in Firestore
  total_amount: number;
  amount_paid: number;
  status: 'pending' | 'delivered';
  created_at: Timestamp;
}

export type Unit = 'ml' | 'L' | 'gm' | 'kg' | 'piece';
