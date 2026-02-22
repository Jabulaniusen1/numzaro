import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { fiveSimClient } from "@/lib/5sim/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { countryCode, service = "ot", operator, maxPrice, numberType = "one_time_otp" } = body;

    if (!countryCode) {
      return NextResponse.json(
        { error: "countryCode is required" },
        { status: 400 }
      );
    }

    // Get current price from 5Sim API and apply markup
    // When called with country+product: { [country]: { [product]: { [operator]: { cost, count } } } }
    let actualCost: number;
    let userCharged: number;
    try {
      const prices = await fiveSimClient.getPrices({ country: countryCode, product: service });

      // When called with country+product, 5Sim returns:
      // { [country]: { [product]: { [operator]: { cost, count } } } }
      const countryOperators: Record<string, { cost: number; count: number }> =
        (prices as any)[countryCode]?.[service] || {};

      // Find the cheapest operator with available numbers
      let lowestCost = Infinity;
      let hasAvailable = false;
      Object.values(countryOperators).forEach((op: any) => {
        if (op.count > 0) {
          hasAvailable = true;
          if (op.cost < lowestCost) lowestCost = op.cost;
        }
      });

      if (!hasAvailable) {
        return NextResponse.json(
          { error: "No numbers available for selected country and service" },
          { status: 400 }
        );
      }

      // Get the original cost (before markup) for our actual cost
      const originalCost = (countryOperators as any)[Object.keys(countryOperators)[0]]?.original_cost || lowestCost;
      actualCost = originalCost; // What we pay to 5Sim
      userCharged = lowestCost; // What customer pays (includes markup)

      if (maxPrice && userCharged > maxPrice) {
        return NextResponse.json(
          { error: `Price ${userCharged} exceeds maximum price ${maxPrice}` },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error("Error fetching price:", error);
      return NextResponse.json(
        { error: "Failed to get pricing information" },
        { status: 500 }
      );
    }

    // Check user's wallet balance
    let userBalance: number;
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();

      userBalance = parseFloat(userData?.wallet_balance || "0");
      
      if (userBalance < userCharged) {
        return NextResponse.json(
          {
            error: "Insufficient balance",
            required: userCharged,
            available: userBalance,
          },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error("Error checking user balance:", error);
      return NextResponse.json(
        { error: "Failed to check user balance" },
        { status: 500 }
      );
    }

    // Purchase number from 5Sim
    // countryCode is the 5Sim country key (e.g. "russia", "england")
    // service is the 5Sim product name (e.g. "telegram", "instagram")
    let order: any;
    try {
      order = await fiveSimClient.buyActivation(countryCode, operator || "any", service);
    } catch (error: any) {
      console.error("5Sim purchase error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to purchase number from 5Sim" },
        { status: 500 }
      );
    }

    // Create database records
    try {
      // Get country name from the countries data or use a default mapping
      const countryNameMap: Record<string, string> = {
        // Major countries
        "1": "United States",
        "7": "Russia",
        "20": "Egypt",
        "27": "South Africa",
        "30": "Greece",
        "31": "Netherlands",
        "32": "Belgium",
        "33": "France",
        "34": "Spain",
        "36": "Hungary",
        "39": "Italy",
        "40": "Romania",
        "41": "Switzerland",
        "43": "Austria",
        "44": "United Kingdom",
        "45": "Denmark",
        "46": "Sweden",
        "47": "Norway",
        "48": "Poland",
        "49": "Germany",
        "51": "Peru",
        "52": "Mexico",
        "53": "Cuba",
        "54": "Argentina",
        "55": "Brazil",
        "56": "Chile",
        "57": "Colombia",
        "58": "Venezuela",
        "60": "Malaysia",
        "61": "Australia",
        "62": "Indonesia",
        "63": "Philippines",
        "64": "New Zealand",
        "65": "Singapore",
        "66": "Thailand",
        "81": "Japan",
        "82": "South Korea",
        "84": "Vietnam",
        "86": "China",
        "90": "Turkey",
        "91": "India",
        "92": "Pakistan",
        "93": "Afghanistan",
        "94": "Sri Lanka",
        "95": "Myanmar",
        "98": "Iran",
        "212": "Morocco",
        "213": "Algeria",
        "216": "Tunisia",
        "218": "Libya",
        "220": "Gambia",
        "221": "Senegal",
        "222": "Mauritania",
        "223": "Mali",
        "224": "Guinea",
        "225": "Ivory Coast",
        "226": "Burkina Faso",
        "227": "Niger",
        "228": "Togo",
        "229": "Benin",
        "230": "Mauritius",
        "231": "Liberia",
        "232": "Sierra Leone",
        "233": "Ghana",
        "234": "Nigeria",
        "235": "Chad",
        "236": "Central African Republic",
        "237": "Cameroon",
        "238": "Cape Verde",
        "239": "São Tomé and Príncipe",
        "240": "Equatorial Guinea",
        "241": "Gabon",
        "242": "Republic of the Congo",
        "243": "Democratic Republic of the Congo",
        "244": "Angola",
        "245": "Guinea-Bissau",
        "246": "Diego Garcia",
        "247": "Ascension Island",
        "248": "Seychelles",
        "249": "Sudan",
        "250": "Rwanda",
        "251": "Ethiopia",
        "252": "Somalia",
        "253": "Djibouti",
        "254": "Kenya",
        "255": "Tanzania",
        "256": "Uganda",
        "257": "Burundi",
        "258": "Mozambique",
        "260": "Zambia",
        "261": "Madagascar",
        "262": "Réunion",
        "263": "Zimbabwe",
        "264": "Namibia",
        "265": "Malawi",
        "266": "Lesotho",
        "267": "Botswana",
        "268": "Eswatini",
        "269": "Comoros",
        "290": "Saint Helena",
        "291": "Svalbard and Jan Mayen",
        "297": "Aruba",
        "298": "Greenland",
        "299": "Saint Pierre and Miquelon",
        "350": "Gibraltar",
        "351": "Portugal",
        "352": "Luxembourg",
        "353": "Ireland",
        "354": "Iceland",
        "355": "Albania",
        "356": "Malta",
        "357": "Cyprus",
        "358": "Finland",
        "359": "Bulgaria",
        "370": "Lithuania",
        "371": "Latvia",
        "372": "Estonia",
        "373": "Moldova",
        "374": "Armenia",
        "375": "Belarus",
        "376": "Andorra",
        "377": "Monaco",
        "378": "San Marino",
        "380": "Ukraine",
        "381": "Serbia",
        "382": "Montenegro",
        "383": "Kosovo",
        "385": "Croatia",
        "386": "Slovenia",
        "387": "Bosnia and Herzegovina",
        "388": "Macedonia",
        "389": "Turkey",
        "420": "Czech Republic",
        "421": "Slovakia",
        "423": "Belarus",
        // Add more as needed
      };
      
      // Use the country key directly as the name (capitalize first letter)
      const countryName = countryCode.charAt(0).toUpperCase() + countryCode.slice(1);

      // Create virtual_number record
      const insertData: any = {
        user_id: user.id,
        phone_number: order.phone,
        country_code: countryCode,
        country_name: countryName,
        twilio_sid: String(order.id),
        status: "active",
        capabilities: ["sms"],
        twilio_monthly_cost: actualCost, // What we paid to 5Sim
        number_type: numberType,
        monthly_cost: null,
        expires_at: null,
        provider: "5sim",
        fivsim_order_id: String(order.id),
      };

      const { data: virtualNumber, error: numberError } = await supabase
        .from("virtual_numbers")
        .insert(insertData)
        .select()
        .single();

      if (numberError) {
        console.error("Error creating virtual_number:", numberError);
        return NextResponse.json(
          { error: "Failed to create database record" },
          { status: 500 }
        );
      }

      // Create number_purchase record with profit tracking
      const profit = userCharged - actualCost;
      const { error: purchaseError } = await supabase
        .from("number_purchases")
        .insert({
          user_id: user.id,
          virtual_number_id: virtualNumber.id,
          amount: userCharged, // What customer paid
          actual_cost: actualCost, // What we paid to 5Sim
          profit: profit, // Our profit
          currency: "RUB", // 5Sim uses RUB
          status: "completed",
        });

      if (purchaseError) {
        console.error("Error creating number_purchase:", purchaseError);
        // Non-critical error, log but don't fail
      }

      // Deduct charged amount from user's wallet
      const { error: walletError } = await supabase
        .from("users")
        .update({ 
          wallet_balance: userBalance - userCharged 
        })
        .eq("id", user.id);

      if (walletError) {
        console.error("Error deducting from wallet:", walletError);
        // Critical error - we should notify but the purchase was still successful
      } else {
        // Create wallet transaction record
        await supabase
          .from("wallet_transactions")
          .insert({
            user_id: user.id,
            type: "order_payment",
            amount: -userCharged, // Negative for deduction
            balance_before: userBalance,
            balance_after: userBalance - userCharged,
            description: `Virtual number purchase: ${order.phone}`,
          });
      }

      // Create notification
      const supabaseForNotification = createServiceRoleClient();
      await supabaseForNotification.from("notifications").insert({
        user_id: user.id,
        type: "transaction",
        title: "Virtual Number Purchased",
        message: `Successfully purchased ${order.phone} (5Sim Activation)`,
        data: {
          type: "number_purchased",
          number: order.phone,
          number_id: virtualNumber.id,
          amount: actualCost,
          number_type: numberType,
          provider: "5sim",
        },
      });

      return NextResponse.json({
        success: true,
        number: {
          id: virtualNumber.id,
          phone_number: virtualNumber.phone_number,
          country_code: virtualNumber.country_code,
          country_name: virtualNumber.country_name,
          status: virtualNumber.status,
          monthly_cost: virtualNumber.monthly_cost,
          number_type: virtualNumber.number_type,
        },
        phoneNumber: order.phone,
        activationId: String(order.id),
      });
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to create database record" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in purchase route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

