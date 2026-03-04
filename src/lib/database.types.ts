export type WineLevel = 'essential' | 'escape' | 'icon'
export type ItemType = 'wine' | 'winery'
export type GrapeType = 'red' | 'white'
export type ProgressStatus = 'wishlist' | 'completed'

export interface Database {
  public: {
    Tables: {
      countries: {
        Row: {
          id: string
          name: string
          image_url: string
          description: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          image_url: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          image_url?: string
          description?: string
        }
      }
      regions: {
        Row: {
          id: string
          name: string
          country_id: string
          parent_id: string | null
          image_url: string
          description: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          country_id: string
          parent_id?: string | null
          image_url: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          country_id?: string
          parent_id?: string | null
          image_url?: string
          description?: string
        }
      }
      collections: {
        Row: {
          id: string
          title: string
          description: string
          level: WineLevel
          cover_image: string
          total_points: number
          created_at: string
        }
        Insert: {
          id: string
          title: string
          description: string
          level: WineLevel
          cover_image: string
          total_points?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          level?: WineLevel
          cover_image?: string
          total_points?: number
        }
      }
      region_collections: {
        Row: {
          region_id: string
          collection_id: string
        }
        Insert: {
          region_id: string
          collection_id: string
        }
        Update: {
          region_id?: string
          collection_id?: string
        }
      }
      brands: {
        Row: {
          id: string
          name: string
          description: string
          image_url: string
          country: string
          region: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description: string
          image_url: string
          country: string
          region?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          image_url?: string
          country?: string
          region?: string | null
        }
      }
      brand_collections: {
        Row: {
          brand_id: string
          collection_id: string
        }
        Insert: {
          brand_id: string
          collection_id: string
        }
        Update: {
          brand_id?: string
          collection_id?: string
        }
      }
      grapes: {
        Row: {
          id: string
          name: string
          description: string
          image_url: string
          type: GrapeType
          characteristics: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description: string
          image_url: string
          type: GrapeType
          characteristics: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          image_url?: string
          type?: GrapeType
          characteristics?: string
        }
      }
      grape_collections: {
        Row: {
          grape_id: string
          collection_id: string
        }
        Insert: {
          grape_id: string
          collection_id: string
        }
        Update: {
          grape_id?: string
          collection_id?: string
        }
      }
      wine_items: {
        Row: {
          id: string
          name: string
          description: string
          type: ItemType
          image_url: string
          points: number
          level: WineLevel
          brand_id: string | null
          wine_type: string | null
          elaboration_method: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description: string
          type: ItemType
          image_url: string
          points?: number
          level: WineLevel
          brand_id?: string | null
          wine_type?: string | null
          elaboration_method?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          type?: ItemType
          image_url?: string
          points?: number
          level?: WineLevel
          brand_id?: string | null
          wine_type?: string | null
          elaboration_method?: string | null
        }
      }
      collection_items: {
        Row: {
          collection_id: string
          item_id: string
        }
        Insert: {
          collection_id: string
          item_id: string
        }
        Update: {
          collection_id?: string
          item_id?: string
        }
      }
      wine_item_regions: {
        Row: {
          wine_item_id: string
          region_id: string
        }
        Insert: {
          wine_item_id: string
          region_id: string
        }
        Update: {
          wine_item_id?: string
          region_id?: string
        }
      }
      wine_item_grapes: {
        Row: {
          wine_item_id: string
          grape_id: string
        }
        Insert: {
          wine_item_id: string
          grape_id: string
        }
        Update: {
          wine_item_id?: string
          grape_id?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          item_id: string
          status: ProgressStatus
          timestamp: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          status: ProgressStatus
          timestamp?: number
          created_at?: string
        }
        Update: {
          status?: ProgressStatus
          timestamp?: number
        }
      }
      user_stats: {
        Row: {
          user_id: string
          total_points: number
          completed_count: number
          wishlist_count: number
          level: number
          updated_at: string
        }
        Insert: {
          user_id: string
          total_points?: number
          completed_count?: number
          wishlist_count?: number
          level?: number
          updated_at?: string
        }
        Update: {
          total_points?: number
          completed_count?: number
          wishlist_count?: number
          level?: number
          updated_at?: string
        }
      }
    }
  }
}
