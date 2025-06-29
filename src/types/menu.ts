export interface MenuItem {
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  isHealthy?: boolean;
  healthScore?: number;
  quality?: 'premium' | 'standard' | 'budget';
  allergens?: string[];
  dietaryTags?: string[];
  calories?: number;
  nutritionInfo?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
  healthyItemsCount?: number;
  averagePrice?: number;
  qualityDistribution?: {
    premium: number;
    standard: number;
    budget: number;
  };
}

export interface ParsedMenu {
  restaurant?: string;
  categories: MenuCategory[];
  extractedAt: string;
  menuId: string;
  summary?: MenuSummary;
}

export interface MenuSummary {
  totalItems: number;
  totalCategories: number;
  itemsWithPrices: number;
  healthyItems: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  qualityDistribution: {
    premium: number;
    standard: number;
    budget: number;
  };
  topAllergens: string[];
  dietaryOptions: {
    vegetarian: number;
    vegan: number;
    glutenFree: number;
    dairyFree: number;
  };
}

export interface OCRProgress {
  status: string;
  progress: number;
}

export interface ProcessedMenus {
  menus: ParsedMenu[];
  combinedSummary: MenuSummary;
}