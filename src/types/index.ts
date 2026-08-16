export interface WebsiteSettings {
  id: number;
  site_name: string;
  logo_url: string;
  theme_color: string;
  wa_group_url: string;
  wa_admin_number: string;
  testimonial_url: string;
  website_status: 'ON' | 'OFF';
  order_status: 'ON' | 'OFF';
  closed_title: string;
  closed_desc: string;
  closed_button_text: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  status: 'ON' | 'OFF';
}

export interface Outlet {
  id: string;
  brand_id: string;
  outlet_name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: string;
  status: 'ON' | 'OFF';
}

export interface CustomizationConfig {
  has_suhu?: boolean;
  has_ukuran?: boolean;
  has_es?: boolean;
  has_gula?: boolean;
  has_beans?: boolean;
  has_syrup?: boolean;
  has_topping?: boolean;
}

export interface Product {
  id: string;
  brand_id: string;
  name: string;
  image: string;
  description: string;
  price: number;
  category: string;
  availability: 'ON' | 'OFF';
  customization_json?: string;
  is_single_item?: boolean | number;
}

export interface SelectedCustomization {
  suhu?: string;
  ukuran?: { name: string; price: number };
  es?: string;
  gula?: string;
  beans?: { name: string; price: number };
  syrup?: { name: string; price: number }[];
  topping?: { name: string; price: number }[];
  notes?: string;
}

export interface CartItem {
  cart_item_id: string;
  product_id: string;
  name: string;
  image: string;
  base_price: number;
  qty: number;
  selected_customization: SelectedCustomization;
  unit_price: number; // base_price + extras
  total_price: number; // unit_price * qty
  is_single_item?: boolean;
}

export interface Order {
  id: string;
  brand_id: string;
  customer_name: string;
  outlet_name: string;
  pickup_type: string; // 'Sekarang' | 'Dijadwalkan'
  pickup_time_info?: string; // e.g. '2026-08-17 - 14:30'
  items_json: string;
  total_price: number;
  created_at?: string;
}
