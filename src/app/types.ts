export type WineLevel = 'essential' | 'escape' | 'icon';

export type ItemType = 'wine' | 'winery';

export interface WineItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  imageUrl: string;
  points: number;
  level: WineLevel;
  wineType?: string | null;
  elaborationMethod?: string | null;
  brandName?: string | null;
  // Links to navigation
  regionIds?: string[]; // Can belong to multiple regions
  brandId?: string; // Belongs to a brand
  grapeIds?: string[]; // Made from these grapes
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  level: WineLevel;
  coverImage: string;
  items: WineItem[];
  totalPoints: number;
}

// Hierarchical Region Structure
export interface Country {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  regions: Region[];
}

export interface Region {
  id: string;
  name: string;
  countryId: string;
  imageUrl: string;
  description: string;
  collections: Collection[];
}

// Brands
export interface Brand {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  country: string;
  region?: string;
  collections: Collection[];
}

// Grapes
export interface Grape {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  type: 'red' | 'white';
  characteristics: string;
  collections: Collection[];
}

export interface Stats {
  totalPoints: number;
  completedCount: number;
  wishlistCount: number;
  level: number;
}

export interface Progress {
  itemId: string;
  status: 'wishlist' | 'completed';
  timestamp: number;
}