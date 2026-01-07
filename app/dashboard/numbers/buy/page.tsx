"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { useRouter } from "next/navigation";
import { Phone, Loader2 } from "lucide-react";

interface AvailableNumber {
  phoneNumber: string;
  regionInformation: {
    regionName: string;
    countryCode: string;
  };
  capabilities: string;
  cost: {
    setupCost: number;
    monthlyCost: number;
  };
  providerId: string;
}

// Common country codes
const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
];

export default function BuyNumberPage() {
  const [country, setCountry] = useState("US");
  const [numberType, setNumberType] = useState<"long_term" | "otp" | "business">("long_term");
  const [capabilities, setCapabilities] = useState<"sms" | "voice" | "sms+voice">("sms+voice");
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [searching, setSearching] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { toast } = useToast();
  const { format } = useCurrency();
  const router = useRouter();

  const handleSearch = async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams({
        country,
        capabilities,
        limit: "10",
      });

      const response = await fetch(`/api/numbers/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableNumbers(data.numbers || []);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to search numbers");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to search numbers",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handlePurchase = async (number: AvailableNumber) => {
    setPurchasing(number.providerId);
    try {
      const response = await fetch("/api/numbers/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumberId: number.phoneNumber,
          country,
          numberType,
          capabilities,
          purchaseCost: number.cost.setupCost,
          monthlyCost: numberType === "otp" ? null : number.cost.monthlyCost,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Number purchased successfully!",
        });
        router.push("/dashboard/numbers");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to purchase number");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to purchase number",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Buy Virtual Number</h1>
        <p className="text-gray-600 mt-2">
          Search and purchase a virtual phone number
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Options</CardTitle>
          <CardDescription>
            Select country, type, and capabilities to search for available numbers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Number Type</Label>
              <select
                id="type"
                value={numberType}
                onChange={(e) =>
                  setNumberType(e.target.value as "long_term" | "otp" | "business")
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="long_term">Long-term Rental</option>
                <option value="business">Business</option>
                <option value="otp">OTP (One-time)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capabilities">Capabilities</Label>
              <select
                id="capabilities"
                value={capabilities}
                onChange={(e) =>
                  setCapabilities(e.target.value as "sms" | "voice" | "sms+voice")
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="sms">SMS Only</option>
                <option value="voice">Voice Only</option>
                <option value="sms+voice">SMS + Voice</option>
              </select>
            </div>
          </div>

          <Button onClick={handleSearch} disabled={searching}>
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              "Search Numbers"
            )}
          </Button>
        </CardContent>
      </Card>

      {availableNumbers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Numbers</CardTitle>
            <CardDescription>
              {availableNumbers.length} number(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableNumbers.map((number) => (
                <div
                  key={number.providerId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{number.phoneNumber}</p>
                      <p className="text-sm text-gray-600">
                        {number.regionInformation.regionName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">
                        {format(number.cost.setupCost)} setup
                      </p>
                      {numberType !== "otp" && (
                        <p className="text-sm text-gray-600">
                          {format(number.cost.monthlyCost)}/mo
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handlePurchase(number)}
                      disabled={purchasing === number.providerId}
                    >
                      {purchasing === number.providerId ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Purchasing...
                        </>
                      ) : (
                        "Purchase"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

