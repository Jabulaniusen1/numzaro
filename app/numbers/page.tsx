"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { NumberPurchaseModal } from "@/components/dashboard/NumberPurchaseModal";
import { Phone, Search, Loader2 } from "lucide-react";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
];

interface AvailableNumber {
  friendlyName: string;
  phoneNumber: string;
  region: string;
  countryCode: string;
  capabilities: {
    voice: boolean;
    SMS: boolean;
    MMS: boolean;
  };
  monthly_cost: number;
  twilio_monthly_cost: number;
}

export default function NumbersPage() {
  const { toast } = useToast();
  const { format, loading: currencyLoading } = useCurrency();
  const [country, setCountry] = useState("US");
  const [numbers, setNumbers] = useState<AvailableNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<AvailableNumber | null>(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  useEffect(() => {
    searchNumbers();
  }, [country]);

  const searchNumbers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/numbers/search?country=${country}&capabilities=SMS`);
      
      if (!response.ok) {
        throw new Error("Failed to search numbers");
      }

      const data = await response.json();
      setNumbers(data.numbers || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load numbers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (number: AvailableNumber) => {
    setSelectedNumber(number);
    setPurchaseModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Virtual Number Marketplace</h1>
        <p className="text-muted-foreground">
          Browse and purchase virtual numbers from different countries
        </p>
      </div>

      <div className="mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Country</label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={searchNumbers} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>

      {loading && numbers.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : numbers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No numbers available for this country</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {numbers.map((number) => (
            <Card key={number.phoneNumber}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  {number.phoneNumber}
                </CardTitle>
                <CardDescription>{number.region}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Monthly Cost</p>
                    <p className="text-2xl font-bold">
                      {currencyLoading ? "Loading..." : format(number.monthly_cost)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {number.capabilities.SMS && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                        SMS
                      </span>
                    )}
                    {number.capabilities.voice && (
                      <span className="text-xs bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                        Voice
                      </span>
                    )}
                    {number.capabilities.MMS && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                        MMS
                      </span>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handlePurchase(number)}
                  >
                    Buy Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NumberPurchaseModal
        open={purchaseModalOpen}
        onOpenChange={setPurchaseModalOpen}
        number={
          selectedNumber
            ? {
                phoneNumber: selectedNumber.phoneNumber,
                countryCode: selectedNumber.countryCode,
                monthly_cost: selectedNumber.monthly_cost,
              }
            : null
        }
        onSuccess={() => {
          searchNumbers();
        }}
      />
    </div>
  );
}








