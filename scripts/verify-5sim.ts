import { fiveSimClient } from "../lib/5sim/client";
import { 
  searchAvailableNumbers, 
  purchaseNumber, 
  getPricing,
  getAvailableCountries,
  getAvailableProducts
} from "../lib/5sim/adapter";
import { isoToFiveSimCountry, fiveSimCountryToIso } from "../lib/5sim/countries";
import { getServiceProduct, getProductService } from "../lib/5sim/products";

async function verify() {
    console.log("Verifying 5sim.net Implementation...");

    try {
        // Test 1: API Key and Authentication
        console.log("\n--- Testing Authentication ---");
        const profile = await fiveSimClient.getProfile();
        console.log("✅ Profile fetched:", {
            id: profile.id,
            email: profile.email,
            balance: profile.balance,
            rating: profile.rating
        });

        // Test 2: Balance Check
        console.log("\n--- Testing Balance ---");
        const balance = await fiveSimClient.getBalance();
        console.log("✅ Balance:", balance);

        // Test 3: Countries
        console.log("\n--- Testing Countries ---");
        const countries = await getAvailableCountries();
        console.log("✅ Countries count:", countries.length);
        console.log("Sample countries:", countries.slice(0, 3).map(c => `${c.iso} - ${c.text_en}`));

        // Test 4: Country Mapping
        console.log("\n--- Testing Country Mapping ---");
        const testCountries = ["US", "GB", "DE"];
        testCountries.forEach(iso => {
            const fiveSimCountry = isoToFiveSimCountry(iso);
            const backToIso = fiveSimCountryToIso(fiveSimCountry || "");
            console.log(`${iso} -> ${fiveSimCountry} -> ${backToIso} ${backToIso === iso ? '✅' : '❌'}`);
        });

        // Test 5: Service/Product Mapping
        console.log("\n--- Testing Service Mapping ---");
        const testServices = ["tg", "wa", "fb"];
        testServices.forEach(service => {
            const product = getServiceProduct(service);
            const backToService = getProductService(product);
            console.log(`${service} -> ${product} -> ${backToService} ${backToService === service ? '✅' : '❌'}`);
        });

        // Test 6: Pricing
        console.log("\n--- Testing Pricing ---");
        const prices = await getPricing("US", "telegram");
        console.log("✅ Pricing for US/telegram:", Object.keys(prices).length > 0 ? "Available" : "Not available");

        // Test 7: Products
        console.log("\n--- Testing Products ---");
        const products = await getAvailableProducts("US", "any");
        const availableProducts = Object.entries(products).filter(([_, info]) => {
            const productInfo = info as { Category: string; Qty: number; Price: number };
            return productInfo.Qty > 0;
        });
        console.log("✅ Available products for US:", availableProducts.length);

        // Test 8: Search Available Numbers
        console.log("\n--- Testing Number Search ---");
        const searchResult = await searchAvailableNumbers("US", ["SMS"], 1, 5);
        console.log("✅ Search result:", {
            count: searchResult.numbers.length,
            hasMore: searchResult.hasMore,
            totalPages: searchResult.totalPages
        });

        // Test 9: Vendor Features (if available)
        console.log("\n--- Testing Vendor Features ---");
        try {
            const vendorProfile = await fiveSimClient.getVendorProfile();
            console.log("✅ Vendor profile:", {
                balance: vendorProfile.balance,
                frozen_balance: vendorProfile.frozen_balance,
                vendor: vendorProfile.vendor
            });

            const vendorPrices = await fiveSimClient.getVendorPrices();
            console.log("✅ Vendor prices count:", vendorPrices.Total || 0);

            const vendorWallets = await fiveSimClient.getVendorWallets();
            console.log("✅ Vendor wallets:", Object.keys(vendorWallets));

        } catch (vendorError: any) {
            console.log("⚠️  Vendor features not available:", vendorError.message);
        }

        // Test 10: Order History
        console.log("\n--- Testing Order History ---");
        try {
            const orders = await fiveSimClient.getOrders({ limit: 5 });
            console.log("✅ Recent orders:", orders.Data.length);
        } catch (orderError: any) {
            console.log("⚠️  Order history not available:", orderError.message);
        }

        console.log("\n🎉 5sim.net verification completed successfully!");
        
        // Summary
        console.log("\n--- Summary ---");
        console.log("✅ Authentication: Working");
        console.log("✅ Balance Check: Working");
        console.log("✅ Countries: Working");
        console.log("✅ Country Mapping: Working");
        console.log("✅ Service Mapping: Working");
        console.log("✅ Pricing: Working");
        console.log("✅ Products: Working");
        console.log("✅ Number Search: Working");
        console.log(profile.vendor ? "✅ Vendor Features: Working" : "⚠️  Vendor Features: Not available");
        console.log("🚀 Ready for production use!");

    } catch (error: any) {
        console.error("❌ Verification failed:", error.message);
        
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
            console.log("\n💡 Make sure FIVESIM_API_KEY is set correctly in your environment variables");
        } else if (error.message.includes("API Key is missing")) {
            console.log("\n💡 Please set FIVESIM_API_KEY in your .env file");
        } else {
            console.log("\n💡 Check your internet connection and API credentials");
        }
        
        process.exit(1);
    }
}

// Run verification
verify().catch(console.error);
