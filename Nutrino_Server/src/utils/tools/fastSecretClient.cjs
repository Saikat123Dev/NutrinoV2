/**
 * FatSecret Platform API Client - Complete Implementation
 * File: fatsecret-client.js
 * 
 * This is the core client that handles all communication with the FatSecret API.
 * Think of this as the "translator" between your application and FatSecret's servers.
 * It handles the complex OAuth authentication and transforms raw API responses
 * into clean, usable data structures.
 */

// Required dependencies for OAuth authentication and HTTP requests
const CryptoJS = require('crypto-js');  // For HMAC-SHA1 signature generation
const axios = require('axios');         // For making HTTP requests to the API

/**
 * Main FatSecret API Client Class
 * 
 * This class encapsulates all the complexity of working with FatSecret's API.
 * The OAuth 1.0a authentication process is particularly complex - it requires
 * generating cryptographic signatures for each request using a specific algorithm
 * that combines your credentials with request parameters and timestamps.
 */
class FatSecretAPIClient {
    constructor(consumerKey, consumerSecret) {
        // Store the API credentials securely within the class instance
        // These credentials are like a username/password pair that identifies
        // your application to FatSecret's servers
        this.consumerKey = consumerKey;
        this.consumerSecret = consumerSecret;
        
        // The base URL for all FatSecret API requests
        // All API calls go through this single endpoint with different parameters
        this.baseURL = 'https://platform.fatsecret.com/rest/server.api';
    }

    /**
     * OAuth 1.0a Signature Generation
     * 
     * This is the most technically challenging part of the implementation.
     * OAuth 1.0a requires a specific signature algorithm that proves you have
     * the secret key without actually sending it over the network.
     * 
     * The process works like this:
     * 1. Collect all request parameters and sort them alphabetically
     * 2. Create a "base string" that represents the entire request
     * 3. Use HMAC-SHA1 to create a cryptographic signature
     * 4. The server can verify this signature using your public consumer key
     */
    generateOAuthSignature(method, url, params) {
        // Step 1: Create a parameter string by encoding and sorting all parameters
        // OAuth requires very specific URL encoding - spaces become %20, etc.
        const sortedParams = Object.keys(params)
            .sort()  // Alphabetical sorting is required by OAuth spec
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');

        // Step 2: Build the signature base string
        // This combines the HTTP method, URL, and parameters in a specific format
        // Each component is URL-encoded separately, then joined with '&'
        const signatureBaseString = [
            method.toUpperCase(),           // HTTP method (GET, POST, etc.)
            encodeURIComponent(url),        // The complete API endpoint URL
            encodeURIComponent(sortedParams) // All parameters as a query string
        ].join('&');

        // Step 3: Create the signing key
        // For consumer-only requests (no user tokens), we append an empty string
        // The '&' is required even when the token secret is empty
        const signingKey = `${encodeURIComponent(this.consumerSecret)}&`;

        // Step 4: Generate the actual signature using HMAC-SHA1
        // This creates a cryptographic hash that proves we know the secret
        // without revealing the secret itself
        return CryptoJS.HmacSHA1(signatureBaseString, signingKey).toString(CryptoJS.enc.Base64);
    }

    /**
     * OAuth Parameter Generation
     * 
     * Every API request needs these OAuth parameters to authenticate properly.
     * Think of these as the "envelope" that wraps around your actual API request.
     * The nonce and timestamp ensure that each request is unique and cannot
     * be replayed by an attacker who intercepts the request.
     */
    generateOAuthParams(additionalParams = {}) {
        // Generate a cryptographically random nonce (number used once)
        // This prevents replay attacks where someone could reuse old requests
        const nonce = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
        
        // Current timestamp in Unix format (seconds since January 1, 1970)
        // This ensures requests have a limited lifetime for security
        const timestamp = Math.floor(Date.now() / 1000).toString();

        // Combine OAuth headers with any API-specific parameters
        const params = {
            oauth_consumer_key: this.consumerKey,        // Your app's public identifier
            oauth_nonce: nonce,                          // Unique request identifier
            oauth_signature_method: 'HMAC-SHA1',         // Signature algorithm
            oauth_timestamp: timestamp,                  // Request timestamp
            oauth_version: '1.0',                        // OAuth version
            ...additionalParams                          // API method and parameters
        };

        // Generate the signature using all parameters
        // This must happen after all parameters are assembled
        const signature = this.generateOAuthSignature('POST', this.baseURL, params);
        
        // Add the signature to complete the OAuth authentication
        params.oauth_signature = signature;
        
        return params;
    }

    /**
     * Food Search Method
     * 
     * This method searches FatSecret's database for foods matching a search term.
     * It's like using a search engine specifically for food items. The results
     * include basic information about each food and a unique ID that you can use
     * to get detailed nutritional information.
     */
    async searchFoods(searchExpression, maxResults = 10) {
        try {
            // Prepare the API request parameters
            // The 'method' parameter tells FatSecret which API operation to perform
            const params = this.generateOAuthParams({
                method: 'foods.search',              // FatSecret API method name
                search_expression: searchExpression, // What to search for
                max_results: maxResults,             // Limit the number of results
                format: 'json'                       // Response format (JSON vs XML)
            });

            console.log(`Searching for foods matching: "${searchExpression}"`);
            
            // Make the HTTP request to FatSecret's servers
            // We use POST with form-encoded data as required by OAuth 1.0a
            const response = await axios.post(this.baseURL, new URLSearchParams(params), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            return response.data;
            
        } catch (error) {
            // Provide helpful error information for debugging
            console.error('Error searching foods:', error.response?.data || error.message);
            throw new Error(`Food search failed: ${error.message}`);
        }
    }

    /**
     * Detailed Food Information Method
     * 
     * Once you have a food ID from the search results, this method retrieves
     * comprehensive nutritional information. This includes serving sizes,
     * calories, macronutrients (protein, carbs, fat), micronutrients (vitamins,
     * minerals), and other detailed nutritional data.
     */
    async getFoodDetails(foodId) {
        try {
            // Prepare parameters for the detailed food lookup
            const params = this.generateOAuthParams({
                method: 'food.get',    // Different API method for detailed info
                food_id: foodId,       // The specific food we want details for
                format: 'json'
            });

            console.log(`Fetching detailed information for food ID: ${foodId}`);
            
            // Make the authenticated request to FatSecret
            const response = await axios.post(this.baseURL, new URLSearchParams(params), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            return response.data;
            
        } catch (error) {
            console.error('Error fetching food details:', error.response?.data || error.message);
            throw new Error(`Food details fetch failed: ${error.message}`);
        }
    }

    /**
     * Combined Recipe Search Method
     * 
     * This is a higher-level method that combines search and detailed retrieval.
     * It's particularly useful for recipe applications where you want both the
     * basic food information and complete nutritional breakdown in one operation.
     * 
     * The method performs these steps:
     * 1. Search for foods matching the search term
     * 2. For each food found, fetch detailed nutritional information
     * 3. Combine the results into a comprehensive data structure
     */
    async getFoodRecipes(searchTerm, maxResults = 5) {
        try {
            // Step 1: Search for foods that might have recipe information
            const searchResults = await this.searchFoods(searchTerm, maxResults);
            
            // Handle the case where no foods are found
            if (!searchResults.foods || !searchResults.foods.food) {
                return { 
                    message: 'No foods found matching your search',
                    searchTerm: searchTerm,
                    totalFound: 0,
                    foods: []
                };
            }

            // FatSecret's API returns either a single object or an array
            // We normalize this to always work with an array for consistency
            const foods = Array.isArray(searchResults.foods.food) 
                ? searchResults.foods.food 
                : [searchResults.foods.food];

            console.log(`Found ${foods.length} foods, fetching detailed nutritional information...`);

            // Step 2: Get detailed information for each food item
            // We use Promise.all to fetch all details concurrently for better performance
            const detailedFoods = await Promise.all(
                foods.map(async (food) => {
                    try {
                        // Attempt to get detailed nutritional information
                        const details = await this.getFoodDetails(food.food_id);
                        return {
                            basicInfo: food,           // Basic search result info
                            nutritionalDetails: details, // Comprehensive nutrition data
                            error: null
                        };
                    } catch (error) {
                        // If we can't get details for this food, include the error
                        // but don't fail the entire operation
                        console.warn(`Could not fetch details for food ID ${food.food_id}:`, error.message);
                        return {
                            basicInfo: food,
                            nutritionalDetails: null,
                            error: error.message
                        };
                    }
                })
            );

            // Return a structured response with all the collected information
            return {
                searchTerm,
                totalFound: foods.length,
                foods: detailedFoods
            };

        } catch (error) {
            console.error('Error fetching food recipes:', error.message);
            throw new Error(`Recipe fetch failed: ${error.message}`);
        }
    }

    /**
     * Nutrition Information Formatter
     * 
     * FatSecret's API returns complex nested objects with lots of optional fields.
     * This method extracts the most commonly needed nutritional values and
     * presents them in a clean, consistent format that's easier for applications
     * to work with.
     */
    formatNutritionalInfo(foodDetails) {
        // Handle missing or malformed data gracefully
        if (!foodDetails || !foodDetails.food) {
            return {
                error: "Nutritional information not available",
                available: false
            };
        }

        const food = foodDetails.food;
        const servings = food.servings;
        
        // Check if serving information exists
        if (!servings || !servings.serving) {
            return {
                error: "Serving information not available",
                available: false
            };
        }

        // Handle both single serving and multiple serving scenarios
        // Some foods have multiple serving size options (e.g., "1 cup", "100g")
        const servingInfo = Array.isArray(servings.serving) 
            ? servings.serving[0]  // Use the first serving option
            : servings.serving;    // Use the single serving option

        // Extract key nutritional values with safe fallbacks
        // The || 'N/A' ensures we always have a value even if the API doesn't provide one
        const nutrition = {
            calories: servingInfo.calories || 'N/A',
            protein: servingInfo.protein || 'N/A',
            carbohydrate: servingInfo.carbohydrate || 'N/A',
            fat: servingInfo.fat || 'N/A',
            fiber: servingInfo.fiber || 'N/A',
            sugar: servingInfo.sugar || 'N/A',
            sodium: servingInfo.sodium || 'N/A',
            servingDescription: servingInfo.serving_description || 'Standard serving',
            available: true
        };

        return nutrition;
    }
}

/**
 * Utility Function for Simple Nutrition Lookup
 * 
 * This is a convenience function that provides a simple interface for the most
 * common use case: getting basic nutritional information for a food by name.
 * It's designed to be easy to use from other parts of your application.
 */
async function getNutritionInfo(searchTerm, consumerKey, consumerSecret) {
    // Create a new client instance for this lookup
    const client = new FatSecretAPIClient(consumerKey, consumerSecret);
    
    try {
        // Search for the food and get detailed information
        const results = await client.getFoodRecipes(searchTerm, 1);
        
        // Check if we found any matching foods
        if (results.foods && results.foods.length > 0) {
            const food = results.foods[0];
            return {
                name: food.basicInfo.food_name,
                description: food.basicInfo.food_description,
                nutrition: food.nutritionalDetails ? 
                    client.formatNutritionalInfo(food.nutritionalDetails) : 
                    { error: 'Nutrition data not available', available: false }
            };
        } else {
            return { 
                error: 'No food found matching your search',
                searchTerm: searchTerm
            };
        }
    } catch (error) {
        return { 
            error: error.message,
            searchTerm: searchTerm
        };
    }
}

/**
 * Demonstration Function
 * 
 * This function shows how to use the API client in real-world scenarios.
 * It demonstrates both simple searches and complex nutritional analysis.
 * This is particularly useful for understanding how all the pieces fit together.
 */
async function demonstrateRecipeFetching() {
    // You need to replace these with your actual FatSecret API credentials
    // Get them by registering at https://platform.fatsecret.com/
    const API_KEY = '2fda0b6078a34c29a29f82034e9cec79';
    const API_SECRET = '5cb0f4050c4c4f628dd1a6b8fe31bb94';

    // Create an instance of our API client
    const fatSecretClient = new FatSecretAPIClient(API_KEY, API_SECRET);

    try {
        console.log('=== FatSecret Recipe and Nutrition Fetcher Demo ===\n');

        // Example 1: Search for chicken-based foods with complete nutrition info
        console.log('1. Searching for chicken-based foods...');
        const chickenResults = await fatSecretClient.getFoodRecipes('grilled chicken', 3);
        
        if (chickenResults.foods && chickenResults.foods.length > 0) {
            chickenResults.foods.forEach((foodItem, index) => {
                console.log(`\n--- Food Item ${index + 1} ---`);
                console.log(`Name: ${foodItem.basicInfo.food_name}`);
                console.log(`Description: ${foodItem.basicInfo.food_description || 'No description'}`);
                
                if (foodItem.nutritionalDetails && !foodItem.error) {
                    const nutrition = fatSecretClient.formatNutritionalInfo(foodItem.nutritionalDetails);
                    if (nutrition.available) {
                        console.log('Nutritional Information:');
                        console.log(`  Serving: ${nutrition.servingDescription}`);
                        console.log(`  Calories: ${nutrition.calories}`);
                        console.log(`  Protein: ${nutrition.protein}g`);
                        console.log(`  Carbohydrates: ${nutrition.carbohydrate}g`);
                        console.log(`  Fat: ${nutrition.fat}g`);
                        console.log(`  Fiber: ${nutrition.fiber}g`);
                        console.log(`  Sugar: ${nutrition.sugar}g`);
                        console.log(`  Sodium: ${nutrition.sodium}mg`);
                    } else {
                        console.log(`  Nutrition: ${nutrition.error}`);
                    }
                } else {
                    console.log('  Detailed nutritional information not available');
                    if (foodItem.error) {
                        console.log(`  Error: ${foodItem.error}`);
                    }
                }
            });
        }

        console.log('\n' + '='.repeat(50));

        // Example 2: Simple nutrition lookup for a common food
        console.log('\n2. Quick nutrition lookup for apple...');
        const appleNutrition = await getNutritionInfo('apple', API_KEY, API_SECRET);
        
        if (!appleNutrition.error) {
            console.log(`\nNutrition information for: ${appleNutrition.name}`);
            console.log(`Description: ${appleNutrition.description || 'No description available'}`);
            
            if (appleNutrition.nutrition && appleNutrition.nutrition.available) {
                console.log('\nNutritional breakdown:');
                const nutrition = appleNutrition.nutrition;
                console.log(`  Serving size: ${nutrition.servingDescription}`);
                console.log(`  Calories: ${nutrition.calories}`);
                console.log(`  Protein: ${nutrition.protein}g`);
                console.log(`  Carbohydrates: ${nutrition.carbohydrate}g`);
                console.log(`  Fat: ${nutrition.fat}g`);
                console.log(`  Fiber: ${nutrition.fiber}g`);
                console.log(`  Sugar: ${nutrition.sugar}g`);
                console.log(`  Sodium: ${nutrition.sodium}mg`);
            } else {
                console.log(`  ${appleNutrition.nutrition.error}`);
            }
        } else {
            console.log(`Error: ${appleNutrition.error}`);
        }

    } catch (error) {
        console.error('Demo failed:', error.message);
        console.log('\nTroubleshooting tips:');
        console.log('1. Verify your FatSecret API credentials are correct');
        console.log('2. Check your internet connection');
        console.log('3. Ensure the FatSecret API service is accessible');
        console.log('4. Check if you have exceeded your API rate limits');
    }
}

// Export all the functions and classes so they can be used in other files
// This is how the router file can import and use the FatSecretAPIClient
module.exports = {
    FatSecretAPIClient,        // Main API client class
    demonstrateRecipeFetching, // Demo function
    getNutritionInfo          // Utility function for simple lookups
};

// If this file is run directly (not imported), execute the demonstration
if (require.main === module) {
    demonstrateRecipeFetching();
}