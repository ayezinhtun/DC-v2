import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // For kiosk mode, we don't need persistent sessions
  },
});

// Database types
export interface DCVisitor {
  id: string;
  name: string;
  nrc_no: string;
  phone_number: string;
  company_name?: string;
  visit_purpose?: string;
  employee_card_number?: string;
  access_container_no?: string;
  access_rack_no?: string;
  inventory_list?: string;
  photo_url?: string;
  in_time: string;
  out_time?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVisitorData {
  name: string;
  nrc_no: string;
  phone_number: string;
  company_name?: string;
  visit_purpose?: string;
  employee_card_number?: string;
  access_container_no?: string;
  access_rack_no?: string;
  inventory_list?: string;
  photo_url?: string;
}