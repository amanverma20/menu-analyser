import { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { OCRProgress, ParsedMenu, ProcessedMenus } from '../types/menu';
import { MenuParser } from '../utils/menuParser';
import { VisionApiService } from '../services/visionApi';

export const useOCR = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<OCRProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ParsedMenu | ProcessedMenus | null>(null);
  const [processedMenus, setProcessedMenus] = useState<ParsedMenu[]>([]);

  const processImages = useCallback(async (files: File[], useGoogleVision = false, apiKey?: string) => {
    setIsProcessing(true);
    setError(null);
    setResults(null);
    setProgress({ status: 'Initializing OCR...', progress: 0 });

    try {
      const newMenus: ParsedMenu[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ 
          status: `Processing file ${i + 1} of ${totalFiles}: ${file.name}`, 
          progress: (i / totalFiles) * 0.8 
        });

        let extractedText = '';

        if (useGoogleVision && apiKey) {
          try {
            extractedText = await VisionApiService.extractTextFromImage(file, apiKey);
          } catch (visionError) {
            console.warn('Google Vision API failed, falling back to Tesseract:', visionError);
            extractedText = await extractWithTesseract(file, i, totalFiles);
          }
        } else {
          extractedText = await extractWithTesseract(file, i, totalFiles);
        }

        setProgress({ 
          status: `Parsing menu structure for ${file.name}...`, 
          progress: ((i + 0.8) / totalFiles) * 0.9 
        });

        const parsedMenu = MenuParser.parseMenuText(extractedText);
        newMenus.push(parsedMenu);
      }

      setProgress({ status: 'Generating combined analysis...', progress: 0.95 });

      // Combine results if multiple menus
      if (newMenus.length === 1) {
        setResults(newMenus[0]);
      } else {
        const combinedResults = combineMenuResults(newMenus);
        setResults(combinedResults);
      }

      setProcessedMenus(prev => [...prev, ...newMenus]);
      setProgress({ status: 'Complete!', progress: 1 });

    } catch (err) {
      console.error('OCR processing failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to process images');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const extractWithTesseract = async (file: File, index: number, total: number): Promise<string> => {
    const worker = await createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          const fileProgress = (index / total) + (m.progress / total) * 0.7;
          setProgress({
            status: `Extracting text from ${file.name}...`,
            progress: fileProgress
          });
        }
      }
    });

    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    return text;
  };

  const combineMenuResults = (menus: ParsedMenu[]): ProcessedMenus => {
    const allItems = menus.flatMap(menu => menu.categories.flatMap(cat => cat.items));
    const itemsWithPrices = allItems.filter(item => item.price);
    const prices = itemsWithPrices.map(item => item.price!);

    // Count allergens across all menus
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

    const combinedSummary = {
      totalItems: allItems.length,
      totalCategories: menus.reduce((sum, menu) => sum + menu.categories.length, 0),
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

    return {
      menus,
      combinedSummary
    };
  };

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(null);
    setError(null);
    setResults(null);
  }, []);

  const clearHistory = useCallback(() => {
    setProcessedMenus([]);
  }, []);

  return {
    processImages,
    reset,
    clearHistory,
    isProcessing,
    progress,
    error,
    results,
    processedMenus
  };
};