import React, { useState } from 'react';
import { Download, Copy, CheckCircle, Eye, EyeOff, Heart, Star, AlertTriangle, Leaf } from 'lucide-react';
import { ParsedMenu, ProcessedMenus } from '../types/menu';

interface ResultsDisplayProps {
  results: ParsedMenu | ProcessedMenus;
  isMultipleMenus?: boolean;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isMultipleMenus = false }) => {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState<{[key: string]: boolean}>({});
  const [activeTab, setActiveTab] = useState<'structured' | 'json'>('structured');
  
  const data = isMultipleMenus ? (results as ProcessedMenus) : { menus: [results as ParsedMenu], combinedSummary: (results as ParsedMenu).summary! };
  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleCategory = (menuId: string, categoryName: string) => {
    const key = `${menuId}-${categoryName}`;
    setCollapsed(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return 'Price not detected';
    return `${currency === 'USD' ? '$' : currency || ''}${price.toFixed(2)}`;
  };

  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case 'premium': return 'text-purple-600 bg-purple-100';
      case 'standard': return 'text-blue-600 bg-blue-100';
      case 'budget': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthColor = (isHealthy?: boolean, healthScore?: number) => {
    if (isHealthy) return 'text-green-600';
    if (healthScore && healthScore > 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Card */}
      <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border border-green-200 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {isMultipleMenus ? 'Combined Analysis Summary' : 'Menu Analysis Summary'}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {data.combinedSummary.totalItems}
            </div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {data.combinedSummary.healthyItems}
            </div>
            <div className="text-sm text-gray-600">Healthy Items</div>
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-1 text-center">
            ${data.combinedSummary.averagePrice.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 text-center">Average Price</div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {data.combinedSummary.qualityDistribution.premium}
            </div>
            <div className="text-sm text-gray-600">Premium Items</div>
          </div>
        </div>

        {/* Health & Quality Metrics */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/60 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Heart className="h-5 w-5 text-red-500 mr-2" />
              Health Analysis
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Healthy Items:</span>
                <span className="font-medium text-green-600">
                  {Math.round((data.combinedSummary.healthyItems / data.combinedSummary.totalItems) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Vegetarian:</span>
                <span className="font-medium">{data.combinedSummary.dietaryOptions.vegetarian}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Vegan:</span>
                <span className="font-medium">{data.combinedSummary.dietaryOptions.vegan}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/60 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              Quality Distribution
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Premium:</span>
                <span className="font-medium text-purple-600">
                  {data.combinedSummary.qualityDistribution.premium}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Standard:</span>
                <span className="font-medium text-blue-600">
                  {data.combinedSummary.qualityDistribution.standard}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Budget:</span>
                <span className="font-medium text-green-600">
                  {data.combinedSummary.qualityDistribution.budget}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div className="mt-6 bg-white/60 rounded-xl p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Price Range</h4>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-green-600">
              ${data.combinedSummary.priceRange.min.toFixed(2)}
            </span>
            <div className="flex-1 mx-4 h-2 bg-gradient-to-r from-green-400 to-red-400 rounded-full"></div>
            <span className="text-lg font-bold text-red-600">
              ${data.combinedSummary.priceRange.max.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Top Allergens */}
        {data.combinedSummary.topAllergens.length > 0 && (
          <div className="mt-6 bg-white/60 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              Common Allergens
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.combinedSummary.topAllergens.map((allergen, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                >
                  {allergen}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('structured')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'structured'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Structured View
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'json'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                JSON Output
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'structured' ? (
            <div className="space-y-6">
              {data.menus.map((menu, menuIndex) => (
                <div key={menu.menuId} className="space-y-4">
                  {isMultipleMenus && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {menu.restaurant || `Menu ${menuIndex + 1}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Processed: {new Date(menu.extractedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {menu.categories.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleCategory(menu.menuId, category.category)}
                        className="w-full bg-gray-50 px-6 py-4 text-left hover:bg-gray-100 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-semibold text-gray-900">{category.category}</h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">
                              {category.items.length} items
                            </span>
                            {category.healthyItemsCount !== undefined && (
                              <span className="text-sm text-green-600">
                                {category.healthyItemsCount} healthy
                              </span>
                            )}
                            {category.averagePrice && (
                              <span className="text-sm text-blue-600">
                                Avg: ${category.averagePrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        {collapsed[`${menu.menuId}-${category.category}`] ? (
                          <Eye className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      
                      {!collapsed[`${menu.menuId}-${category.category}`] && (
                        <div className="p-6 space-y-4">
                          {category.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h5 className="font-semibold text-gray-900">{item.name}</h5>
                                    {item.isHealthy && (
                                      <Leaf className="h-4 w-4 text-green-500" />
                                    )}
                                    {item.quality && (
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(item.quality)}`}>
                                        {item.quality}
                                      </span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                  )}
                                </div>
                                <div className="ml-4 text-right">
                                  <span className={`font-bold text-lg ${item.price ? 'text-green-600' : 'text-gray-400'}`}>
                                    {formatPrice(item.price, item.currency)}
                                  </span>
                                </div>
                              </div>

                              {/* Enhanced Item Details */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                                {item.healthScore !== undefined && (
                                  <div className="text-center">
                                    <div className={`text-lg font-bold ${getHealthColor(item.isHealthy, item.healthScore)}`}>
                                      {item.healthScore}
                                    </div>
                                    <div className="text-xs text-gray-500">Health Score</div>
                                  </div>
                                )}
                                {item.calories && (
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-orange-600">
                                      {item.calories}
                                    </div>
                                    <div className="text-xs text-gray-500">Calories</div>
                                  </div>
                                )}
                                {item.nutritionInfo?.protein && (
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-blue-600">
                                      {item.nutritionInfo.protein}g
                                    </div>
                                    <div className="text-xs text-gray-500">Protein</div>
                                  </div>
                                )}
                                {item.nutritionInfo?.fiber && (
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">
                                      {item.nutritionInfo.fiber}g
                                    </div>
                                    <div className="text-xs text-gray-500">Fiber</div>
                                  </div>
                                )}
                              </div>

                              {/* Tags */}
                              {(item.dietaryTags?.length || item.allergens?.length) && (
                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                                  {item.dietaryTags?.map((tag, tagIndex) => (
                                    <span
                                      key={tagIndex}
                                      className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {item.allergens?.map((allergen, allergenIndex) => (
                                    <span
                                      key={allergenIndex}
                                      className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium"
                                    >
                                      ⚠️ {allergen}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <pre className="bg-gray-50 p-6 rounded-xl overflow-x-auto text-sm">
              <code>{jsonString}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};