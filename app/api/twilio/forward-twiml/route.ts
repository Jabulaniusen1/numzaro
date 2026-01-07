import { NextRequest, NextResponse } from "next/server";

// Dynamic import for Twilio
let twilio: any;
try {
  twilio = require("twilio");
} catch (error) {
  twilio = null;
}

/**
 * TwiML endpoint for call forwarding
 * Twilio will call this endpoint when a call comes in to forward it
 */
export async function GET(request: NextRequest) {
  try {
    if (!twilio || !twilio.twiml) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Twilio SDK not configured.</Say></Response>',
        {
          headers: {
            "Content-Type": "text/xml",
          },
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const to = searchParams.get("to");

    if (!to) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Invalid forwarding configuration.</Say></Response>',
        {
          headers: {
            "Content-Type": "text/xml",
          },
        }
      );
    }

    // Create TwiML to forward the call
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.dial(to);

    return new NextResponse(twiml.toString(), {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error: any) {
    console.error("TwiML generation error:", error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say("An error occurred. Please try again later.");
    
    return new NextResponse(twiml.toString(), {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }
}

