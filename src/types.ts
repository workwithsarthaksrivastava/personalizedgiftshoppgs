export type Category = 'Album Printing' | 'Photo Frames' | 'UV Printing' | 'Sublimation';

export type OrderStatus = 
  | 'Order Placed' 
  | 'Design Under Review' 
  | 'Printing in Progress' 
  | 'Packed & Ready' 
  | 'Out for Delivery' 
  | 'Delivered';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'customer';
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: Category;
  basePrice: number;
  images: string[];
  variants?: any[];
  isActive: boolean;
}

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  config?: any; // For custom designs/sizes
}

export interface Order {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
  };
  createdAt: string;
  updatedAt: string;
}
