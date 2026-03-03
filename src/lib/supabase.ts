import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[WineGallery] Supabase credentials not found. ' +
    'Copy .env.example to .env.local and fill in your project values.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type Database = {
  public: {
    Tables: {
      countries: {
        Row: { id: string; name: string; image_url: string | null; description: string | null; created_at: string; updated_at: string };
        Insert: { id: string; name: string; image_url?: string | null; description?: string | null };
        Update: { id?: string; name?: string; image_url?: string | null; description?: string | null };
      };
      regions: {
        Row: { id: string; name: string; country_id: string; image_url: string | null; description: string | null; created_at: string; updated_at: string };
        Insert: { id: string; name: string; country_id: string; image_url?: string | null; description?: string | null };
        Update: { id?: string; name?: string; country_id?: string; image_url?: string | null; description?: string | null };
      };
      brands: {
        Row: { id: string; name: string; description: string | null; image_url: string | null; country: string | null; region: string | null; created_at: string; updated_at: string };
        Insert: { id: string; name: string; description?: string | null; image_url?: string | null; country?: string | null; region?: string | null };
        Update: { id?: string; name?: string; description?: string | null; image_url?: string | null; country?: string | null; region?: string | null };
      };
      grapes: {
        Row: { id: string; name: string; description: string | null; image_url: string | null; type: 'red' | 'white'; characteristics: string | null; created_at: string; updated_at: string };
        Insert: { id: string; name: string; description?: string | null; image_url?: string | null; type: 'red' | 'white'; characteristics?: string | null };
        Update: { id?: string; name?: string; description?: string | null; image_url?: string | null; type?: 'red' | 'white'; characteristics?: string | null };
      };
      collections: {
        Row: { id: string; title: string; description: string | null; level: 'essential' | 'escape' | 'icon'; cover_image: string | null; total_points: number; region_id: string | null; brand_id: string | null; grape_id: string | null; created_at: string; updated_at: string };
        Insert: { id: string; title: string; description?: string | null; level: 'essential' | 'escape' | 'icon'; cover_image?: string | null; total_points?: number; region_id?: string | null; brand_id?: string | null; grape_id?: string | null };
        Update: { id?: string; title?: string; description?: string | null; level?: 'essential' | 'escape' | 'icon'; cover_image?: string | null; total_points?: number; region_id?: string | null; brand_id?: string | null; grape_id?: string | null };
      };
      wine_items: {
        Row: { id: string; name: string; description: string | null; type: 'wine' | 'winery'; image_url: string | null; points: number; level: 'essential' | 'escape' | 'icon'; brand_id: string | null; created_at: string; updated_at: string };
        Insert: { id: string; name: string; description?: string | null; type: 'wine' | 'winery'; image_url?: string | null; points?: number; level: 'essential' | 'escape' | 'icon'; brand_id?: string | null };
        Update: { id?: string; name?: string; description?: string | null; type?: 'wine' | 'winery'; image_url?: string | null; points?: number; level?: 'essential' | 'escape' | 'icon'; brand_id?: string | null };
      };
      user_progress: {
        Row: { id: string; user_key: string; item_id: string; status: 'wishlist' | 'completed'; created_at: string; updated_at: string };
        Insert: { user_key: string; item_id: string; status: 'wishlist' | 'completed' };
        Update: { status?: 'wishlist' | 'completed' };
      };
    };
  };
};
