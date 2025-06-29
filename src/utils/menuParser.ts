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
    'specials', 'daily specials', 'chef specials',
    'fries', 'french fries'
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
    console.log('Raw OCR Text:', ocrText);
    
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('Processed lines:', lines);
    
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

    // Enhanced parsing approach
    const allItems = this.extractAllMenuItems(lines);
    console.log('Extracted items:', allItems);

    // Group items by category if categories are detected
    const detectedCategories = this.detectCategories(lines);
    console.log('Detected categories:', detectedCategories);

    if (detectedCategories.length > 0) {
      // Process with categories
      for (const categoryInfo of detectedCategories) {
        const categoryItems = allItems.filter(item => 
          item.lineIndex >= categoryInfo.startIndex && 
          item.lineIndex < categoryInfo.endIndex
        );

        if (categoryItems.length > 0) {
          const category: MenuCategory = {
            category: categoryInfo.name,
            items: categoryItems.map(item => item.menuItem)
          };
          this.enhanceCategoryData(category);
          categories.push(category);
        }
      }
    } else {
      // No categories detected, put all items in one category
      if (allItems.length > 0) {
        const category: MenuCategory = {
          category: 'Menu Items',
          items: allItems.map(item => item.menuItem)
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
    console.log('Final parsed menu:', parsedMenu);

    return parsedMenu;
  }

  private static extractAllMenuItems(lines: string[]): Array<{menuItem: MenuItem, lineIndex: number}> {
    const items: Array<{menuItem: MenuItem, lineIndex: number}> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip category headers
      if (this.isLikelyCategory(line)) {
        continue;
      }

      // Try to parse as menu item
      const menuItem = this.parseMenuItemAdvanced(line);
      if (menuItem) {
        items.push({ menuItem, lineIndex: i });
      }
    }

    return items;
  }

  private static parseMenuItemAdvanced(line: string): MenuItem | null {
    console.log('Parsing line:', line);
    
    // Extract all prices from the line
    const prices = this.extractAllPrices(line);
    console.log('Found prices:', prices);
    
    // Remove all prices to get the name part
    let nameText = line;
    for (const pattern of this.PRICE_PATTERNS) {
      pattern.lastIndex = 0;
      nameText = nameText.replace(pattern, '');
    }
    
    // Clean up the name
    nameText = nameText.trim();
    nameText = nameText.replace(/\s+/g, ' '); // Replace multiple spaces with single space
    nameText = nameText.replace(/[^\w\s&'-]/g, ''); // Remove special chars except &, ', -
    
    console.log('Cleaned name text:', nameText);
    
    // Skip if name is too short or looks invalid
    if (!nameText || nameText.length < 3) {
      console.log('Skipping - name too short');
      return null;
    }

    // Skip if it's just numbers or common non-menu text
    if (/^\d+$/.test(nameText) || 
        nameText.toLowerCase().includes('menu') ||
        nameText.toLowerCase().includes('page') ||
        nameText.toLowerCase().includes('call') ||
        nameText.toLowerCase().includes('phone')) {
      console.log('Skipping - not a menu item');
      return null;
    }

    // Split name and description if there's a dash or colon
    const parts = nameText.split(/[-:]/);
    const name = parts[0]?.trim();
    const description = parts.slice(1).join(' - ').trim();

    if (!name || name.length < 2) {
      console.log('Skipping - invalid name after splitting');
      return null;
    }

    // Use the first price found, or undefined if no price
    const price = prices.length > 0 ? prices[0] : undefined;

    const item: MenuItem = {
      name: this.capitalizeWords(name),
      description: description.length > 0 ? description : undefined,
      price: price,
      currency: price ? 'USD' : undefined
    };

    // Enhance with additional features
    this.enhanceMenuItem(item, line);
    
    console.log('Created menu item:', item);
    return item;
  }

  private static extractAllPrices(text: string): number[] {
    const prices: number[] = [];
    
    for (const pattern of this.PRICE_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const priceStr = match[1];
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0 && price < 1000) { // Reasonable price range
          prices.push(price);
        }
      }
    }
    
    return [...new Set(prices)]; // Remove duplicates
  }

  private static detectCategories(lines: string[]): Array<{name: string, startIndex: number, endIndex: number}> {
    const categories: Array<{name: string, startIndex: number, endIndex: number}> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (this.isLikelyCategory(line)) {
        const nextCategoryIndex = this.findNextCategoryIndex(lines, i + 1);
        categories.push({
          name: this.cleanCategoryName(line),
          startIndex: i + 1,
          endIndex: nextCategoryIndex !== -1 ? nextCategoryIndex : lines.length
        });
      }
    }
    
    return categories;
  }

  private static findNextCategoryIndex(lines: string[], startIndex: number): number {
    for (let i = startIndex; i < lines.length; i++) {
      if (this.isLikelyCategory(lines[i])) {
        return i;
      }
    }
    return -1;
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
    if (text.includes('fries')) baseCalories = 350;

    // Adjust based on cooking method
    if (text.includes('fried') || text.includes('crispy')) baseCalories += 200;
    if (text.includes('grilled') || text.includes('steamed')) baseCalories -= 50;
    if (text.includes('loaded')) baseCalories += 150;

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
    if (text.includes('pasta') || text.includes('rice') || text.includes('bread') || text.includes('fries')) {
      nutrition.carbs += 25;
    }
    if (text.includes('avocado') || text.includes('nuts') || text.includes('cheese') || text.includes('loaded')) {
      nutrition.fat += 15;
    }
    if (text.includes('vegetables') || text.includes('beans') || text.includes('quinoa')) {
      nutrition.fiber += 8;
    }
    if (text.includes('sweet potato')) {
      nutrition.fiber += 5;
      nutrition.carbs += 10;
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

  // Helper methods
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

  private static containsPrice(text: string): boolean {
    return this.PRICE_PATTERNS.some(pattern => {
      pattern.lastIndex = 0;
      return pattern.test(text);
    });
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