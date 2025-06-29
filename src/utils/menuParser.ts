import { MenuCategory, MenuItem, ParsedMenu, MenuSummary } from '../types/menu';

export class MenuParser {
  private static readonly PRICE_PATTERNS = [
    /\$\s*(\d+(?:\.\d{2})?)/g,
    /(\d+(?:\.\d{2})?)\s*\$/g,
    /(\d+(?:\.\d{2})?)\s*USD/gi,
    /(\d+(?:\.\d{2})?)\s*dollars?/gi,
  ];

  private static readonly CATEGORY_INDICATORS = [
    'appetizers', 'starters', 'apps', 'small plates',
    'salads', 'soups', 'soup & salad',
    'mains', 'entrees', 'main courses', 'entrées',
    'pasta', 'pizza', 'burgers', 'sandwiches',
    'seafood', 'meat', 'chicken', 'beef', 'pork',
    'vegetarian', 'vegan', 'sides', 'desserts',
    'beverages', 'drinks', 'cocktails', 'wine', 'beer',
    'breakfast', 'lunch', 'dinner', 'brunch',
    'specials', 'daily specials', 'chef specials'
  ];

  private static readonly HEALTHY_KEYWORDS = [
    'grilled', 'steamed', 'baked', 'roasted', 'fresh', 'organic',
    'salad', 'vegetables', 'quinoa', 'kale', 'spinach', 'avocado',
    'lean', 'low-fat', 'whole grain', 'brown rice', 'salmon',
    'chicken breast', 'turkey', 'tofu', 'legumes', 'beans'
  ];

  private static readonly UNHEALTHY_KEYWORDS = [
    'fried', 'deep-fried', 'crispy', 'breaded', 'battered',
    'creamy', 'buttery', 'cheese sauce', 'bacon', 'sausage',
    'processed', 'smoked', 'cured', 'mayo', 'ranch'
  ];

  private static readonly ALLERGENS = [
    'nuts', 'peanuts', 'dairy', 'milk', 'eggs', 'wheat', 'gluten',
    'soy', 'shellfish', 'fish', 'sesame', 'tree nuts'
  ];

  private static readonly DIETARY_TAGS = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto',
    'paleo', 'low-carb', 'sugar-free', 'organic', 'non-gmo'
  ];

  public static parseMenuText(ocrText: string): ParsedMenu {
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const categories: MenuCategory[] = [];
    let currentCategory: MenuCategory | null = null;
    let restaurantName = '';

    // Try to identify restaurant name
    const potentialRestaurantLines = lines.slice(0, 3);
    for (const line of potentialRestaurantLines) {
      if (this.isLikelyRestaurantName(line)) {
        restaurantName = line;
        break;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';

      if (this.isLikelyCategory(line)) {
        if (currentCategory && currentCategory.items.length > 0) {
          this.enhanceCategoryData(currentCategory);
          categories.push(currentCategory);
        }
        
        currentCategory = {
          category: this.cleanCategoryName(line),
          items: []
        };
        continue;
      }

      if (currentCategory && this.isLikelyMenuItem(line)) {
        const item = this.parseMenuItem(line, nextLine);
        if (item) {
          currentCategory.items.push(item);
        }
      } else if (!currentCategory && this.isLikelyMenuItem(line)) {
        if (!currentCategory) {
          currentCategory = {
            category: 'Menu Items',
            items: []
          };
        }
        const item = this.parseMenuItem(line, nextLine);
        if (item) {
          currentCategory.items.push(item);
        }
      }
    }

    if (currentCategory && currentCategory.items.length > 0) {
      this.enhanceCategoryData(currentCategory);
      categories.push(currentCategory);
    }

    if (categories.length === 0) {
      const items = this.parseSimpleItemList(lines);
      if (items.length > 0) {
        const category: MenuCategory = {
          category: 'Menu Items',
          items
        };
        this.enhanceCategoryData(category);
        categories.push(category);
      }
    }

    const menuId = this.generateMenuId();
    const parsedMenu: ParsedMenu = {
      restaurant: restaurantName,
      categories,
      extractedAt: new Date().toISOString(),
      menuId
    };

    parsedMenu.summary = this.generateMenuSummary(parsedMenu);

    return parsedMenu;
  }

  private static parseMenuItem(line: string, nextLine: string = ''): MenuItem | null {
    const fullText = nextLine && !this.isLikelyCategory(nextLine) && !this.containsPrice(nextLine) 
      ? `${line} ${nextLine}` 
      : line;

    const price = this.extractPrice(fullText);
    const cleanedText = this.removePriceFromText(fullText);
    
    const parts = cleanedText.split(/[-.—]/);
    const name = parts[0]?.trim();
    const description = parts.slice(1).join(' - ').trim();

    if (!name || name.length < 2) {
      return null;
    }

    const item: MenuItem = {
      name: this.capitalizeWords(name),
      description: description.length > 0 ? description : undefined,
      price: price || undefined,
      currency: price ? 'USD' : undefined
    };

    // Enhance with additional features
    this.enhanceMenuItem(item, fullText);

    return item;
  }

  private static enhanceMenuItem(item: MenuItem, fullText: string): void {
    const text = fullText.toLowerCase();
    
    // Health analysis
    const healthyCount = this.HEALTHY_KEYWORDS.filter(keyword => text.includes(keyword)).length;
    const unhealthyCount = this.UNHEALTHY_KEYWORDS.filter(keyword => text.includes(keyword)).length;
    
    item.healthScore = Math.max(0, Math.min(100, (healthyCount * 20) - (unhealthyCount * 15) + 50));
    item.isHealthy = item.healthScore >= 60;

    // Quality assessment based on price and ingredients
    if (item.price) {
      if (item.price >= 25) {
        item.quality = 'premium';
      } else if (item.price >= 15) {
        item.quality = 'standard';
      } else {
        item.quality = 'budget';
      }
    } else {
      // Assess quality based on ingredients if no price
      const premiumIngredients = ['truffle', 'wagyu', 'lobster', 'caviar', 'organic', 'artisanal'];
      const hasPremiumIngredients = premiumIngredients.some(ingredient => text.includes(ingredient));
      item.quality = hasPremiumIngredients ? 'premium' : 'standard';
    }

    // Allergen detection
    item.allergens = this.ALLERGENS.filter(allergen => text.includes(allergen));

    // Dietary tags
    item.dietaryTags = this.DIETARY_TAGS.filter(tag => text.includes(tag.replace('-', ' ')));

    // Estimate calories (rough estimation based on item type and ingredients)
    item.calories = this.estimateCalories(text, item.price);

    // Basic nutrition info estimation
    item.nutritionInfo = this.estimateNutrition(text);
  }

  private static estimateCalories(text: string, price?: number): number {
    let baseCalories = 300; // Default base

    // Adjust based on food type
    if (text.includes('salad')) baseCalories = 200;
    if (text.includes('soup')) baseCalories = 150;
    if (text.includes('burger') || text.includes('pizza')) baseCalories = 600;
    if (text.includes('pasta')) baseCalories = 500;
    if (text.includes('steak') || text.includes('ribs')) baseCalories = 700;
    if (text.includes('dessert') || text.includes('cake')) baseCalories = 400;

    // Adjust based on cooking method
    if (text.includes('fried') || text.includes('crispy')) baseCalories += 200;
    if (text.includes('grilled') || text.includes('steamed')) baseCalories -= 50;

    // Adjust based on price (higher price often means larger portions)
    if (price && price > 20) baseCalories += 100;
    if (price && price < 10) baseCalories -= 50;

    return Math.max(50, baseCalories);
  }

  private static estimateNutrition(text: string) {
    const nutrition = {
      protein: 15,
      carbs: 30,
      fat: 10,
      fiber: 5
    };

    // Adjust based on ingredients
    if (text.includes('chicken') || text.includes('beef') || text.includes('fish')) {
      nutrition.protein += 20;
    }
    if (text.includes('pasta') || text.includes('rice') || text.includes('bread')) {
      nutrition.carbs += 25;
    }
    if (text.includes('avocado') || text.includes('nuts') || text.includes('cheese')) {
      nutrition.fat += 15;
    }
    if (text.includes('vegetables') || text.includes('beans') || text.includes('quinoa')) {
      nutrition.fiber += 8;
    }

    return nutrition;
  }

  private static enhanceCategoryData(category: MenuCategory): void {
    const items = category.items;
    
    category.healthyItemsCount = items.filter(item => item.isHealthy).length;
    
    const itemsWithPrices = items.filter(item => item.price);
    if (itemsWithPrices.length > 0) {
      category.averagePrice = itemsWithPrices.reduce((sum, item) => sum + (item.price || 0), 0) / itemsWithPrices.length;
    }

    category.qualityDistribution = {
      premium: items.filter(item => item.quality === 'premium').length,
      standard: items.filter(item => item.quality === 'standard').length,
      budget: items.filter(item => item.quality === 'budget').length
    };
  }

  private static generateMenuSummary(menu: ParsedMenu): MenuSummary {
    const allItems = menu.categories.flatMap(cat => cat.items);
    const itemsWithPrices = allItems.filter(item => item.price);
    const prices = itemsWithPrices.map(item => item.price!);

    // Count allergens
    const allergenCounts: { [key: string]: number } = {};
    allItems.forEach(item => {
      item.allergens?.forEach(allergen => {
        allergenCounts[allergen] = (allergenCounts[allergen] || 0) + 1;
      });
    });

    const topAllergens = Object.entries(allergenCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([allergen]) => allergen);

    return {
      totalItems: allItems.length,
      totalCategories: menu.categories.length,
      itemsWithPrices: itemsWithPrices.length,
      healthyItems: allItems.filter(item => item.isHealthy).length,
      averagePrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0
      },
      qualityDistribution: {
        premium: allItems.filter(item => item.quality === 'premium').length,
        standard: allItems.filter(item => item.quality === 'standard').length,
        budget: allItems.filter(item => item.quality === 'budget').length
      },
      topAllergens,
      dietaryOptions: {
        vegetarian: allItems.filter(item => item.dietaryTags?.includes('vegetarian')).length,
        vegan: allItems.filter(item => item.dietaryTags?.includes('vegan')).length,
        glutenFree: allItems.filter(item => item.dietaryTags?.includes('gluten-free')).length,
        dairyFree: allItems.filter(item => item.dietaryTags?.includes('dairy-free')).length
      }
    };
  }

  private static generateMenuId(): string {
    return `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper methods (keeping existing ones)
  private static isLikelyRestaurantName(line: string): boolean {
    const cleaned = line.toLowerCase();
    return (
      line.length > 3 && 
      line.length < 50 &&
      !this.containsPrice(line) &&
      !this.isLikelyCategory(line) &&
      (cleaned.includes('restaurant') || 
       cleaned.includes('cafe') || 
       cleaned.includes('bistro') ||
       cleaned.includes('grill') ||
       cleaned.includes('kitchen') ||
       /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(line))
    );
  }

  private static isLikelyCategory(line: string): boolean {
    const cleaned = line.toLowerCase().replace(/[^\w\s]/g, '');
    
    for (const indicator of this.CATEGORY_INDICATORS) {
      if (cleaned.includes(indicator)) {
        return true;
      }
    }

    return (
      line === line.toUpperCase() && 
      line.length > 3 && 
      line.length < 40 &&
      !this.containsPrice(line) &&
      !/\d/.test(line)
    );
  }

  private static isLikelyMenuItem(line: string): boolean {
    const hasPrice = this.containsPrice(line);
    const hasText = line.length > 5;
    const isNotCategory = !this.isLikelyCategory(line);
    
    return hasText && isNotCategory && (hasPrice || this.looksLikeItemName(line));
  }

  private static looksLikeItemName(line: string): boolean {
    const words = line.split(/\s+/);
    return (
      words.length >= 1 && 
      words.length <= 8 &&
      words[0][0]?.toUpperCase() === words[0][0]
    );
  }

  private static containsPrice(text: string): boolean {
    return this.PRICE_PATTERNS.some(pattern => {
      pattern.lastIndex = 0;
      return pattern.test(text);
    });
  }

  private static parseSimpleItemList(lines: string[]): MenuItem[] {
    const items: MenuItem[] = [];
    
    for (const line of lines) {
      if (this.isLikelyMenuItem(line)) {
        const item = this.parseMenuItem(line);
        if (item) {
          items.push(item);
        }
      }
    }
    
    return items;
  }

  private static extractPrice(text: string): number | null {
    for (const pattern of this.PRICE_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        const priceStr = match[1];
        const price = parseFloat(priceStr);
        if (!isNaN(price)) {
          return price;
        }
      }
    }
    return null;
  }

  private static removePriceFromText(text: string): string {
    let cleaned = text;
    for (const pattern of this.PRICE_PATTERNS) {
      pattern.lastIndex = 0;
      cleaned = cleaned.replace(pattern, '');
    }
    return cleaned.trim();
  }

  private static cleanCategoryName(name: string): string {
    return this.capitalizeWords(
      name.replace(/[^\w\s]/g, '').trim()
    );
  }

  private static capitalizeWords(text: string): string {
    return text.replace(/\b\w+/g, word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
  }
}