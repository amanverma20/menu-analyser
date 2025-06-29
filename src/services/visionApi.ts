import axios from 'axios';

export class VisionApiService {
  private static readonly GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';
  
  public static async extractTextFromImage(imageFile: File, apiKey?: string): Promise<string> {
    if (!apiKey) {
      throw new Error('Google Vision API key is required');
    }

    try {
      // Convert image to base64 (without data URI prefix)
      const base64Image = await this.fileToBase64(imageFile);
      
      // Use the EXACT format from your documentation
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image // Raw base64 string, no prefix
            },
            features: [
              {
                type: "TEXT_DETECTION"
              }
            ]
          }
        ]
      };

      console.log('Making Vision API request...');
      console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
      console.log('Base64 image length:', base64Image.length);

      const response = await axios.post(
        `${this.GOOGLE_VISION_API_URL}?key=${apiKey}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Vision API Response Status:', response.status);
      console.log('Vision API Response:', response.data);

      if (response.data.responses && response.data.responses[0]) {
        const result = response.data.responses[0];
        
        // Check for errors in the response
        if (result.error) {
          console.error('Vision API Error:', result.error);
          throw new Error(`Google Vision API error: ${result.error.message}`);
        }
        
        // Extract text from textAnnotations
        if (result.textAnnotations && result.textAnnotations.length > 0) {
          const extractedText = result.textAnnotations[0].description;
          console.log('Successfully extracted text, length:', extractedText?.length || 0);
          return extractedText || '';
        }
        
        // No text found
        throw new Error('No text detected in the image');
      }

      throw new Error('Invalid response from Google Vision API');
      
    } catch (error: any) {
      console.error('Google Vision API error details:', error);
      
      if (error.response) {
        console.error('API Error Response:', error.response.data);
        const status = error.response.status;
        const errorData = error.response.data?.error;
        
        if (status === 400) {
          if (errorData?.message?.includes('API key not valid')) {
            throw new Error('❌ Invalid API key. Please check your Google Vision API key.');
          } else if (errorData?.message?.includes('API has not been used') || errorData?.message?.includes('not enabled')) {
            throw new Error('❌ Google Vision API is not enabled. Please enable it in Google Cloud Console.');
          } else {
            throw new Error(`❌ Bad request: ${errorData?.message || 'Please check your API setup'}`);
          }
        } else if (status === 403) {
          throw new Error('❌ Access denied. Please check API permissions and billing.');
        } else {
          throw new Error(`❌ API request failed (${status}): ${errorData?.message || 'Unknown error'}`);
        }
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('❌ Failed to extract text using Google Vision API');
    }
  }

  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Extract ONLY the base64 part, removing "data:image/jpeg;base64," prefix
        const base64 = result.split(',')[1];
        if (!base64) {
          reject(new Error('Failed to convert file to base64'));
          return;
        }
        console.log('Base64 conversion successful, length:', base64.length);
        resolve(base64);
      };
      reader.onerror = error => reject(new Error('Failed to read file'));
    });
  }
}