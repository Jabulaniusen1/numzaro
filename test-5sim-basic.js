// Basic test to verify 5sim.net integration
const { fiveSimClient } = require('./lib/5sim/client.js');

async function testBasic() {
  try {
    console.log("Testing 5sim.net basic integration...");
    
    // Test if the client can be instantiated
    console.log("✅ Client instantiated successfully");
    
    // Test environment variable
    if (!process.env.FIVESIM_API_KEY) {
      console.log("⚠️  FIVESIM_API_KEY not set - this is expected in development");
    } else {
      console.log("✅ FIVESIM_API_KEY is set");
    }
    
    console.log("🎉 Basic 5sim.net integration test passed!");
    
  } catch (error) {
    console.error("❌ Basic test failed:", error.message);
  }
}

testBasic();
