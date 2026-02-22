"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { Loader2, Phone, Globe, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FiveSimCountry {
  iso: string;
  text_en: string;
  operators: string[];
}

interface FiveSimProduct {
  [key: string]: {
    Category: string;
    Qty: number;
    Price: number;
  };
}

interface FiveSimPrice {
  country: string;
  product: string;
  price: number;
  operator: string;
  count: number;
}

interface FiveSimPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (number: any) => void;
}

export function FiveSimPurchaseModal({
  open,
  onOpenChange,
  onSuccess,
}: FiveSimPurchaseModalProps) {
  const { toast } = useToast();
  const { format, convert, currency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [countries, setCountries] = useState<FiveSimCountry[]>([]);
  const [products, setProducts] = useState<FiveSimProduct>({});
  const [prices, setPrices] = useState<Record<string, Record<string, FiveSimPrice>>>({});
  
  // Form state
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("any");
  const [selectedService, setSelectedService] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Load countries on mount
  useEffect(() => {
    if (open) {
      loadCountries();
      loadBalance();
    }
  }, [open]);

  // Load products when country changes
  useEffect(() => {
    if (selectedCountry && selectedOperator) {
      loadProducts();
      loadPrices();
    }
  }, [selectedCountry, selectedOperator]);

  const loadBalance = async () => {
    try {
      const response = await fetch("/api/5sim/vendor/balance");
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
      }
    } catch (error) {
      console.error("Error loading balance:", error);
    }
  };

  const loadCountries = async () => {
    setLoadingCountries(true);
    try {
      const response = await fetch("/api/5sim/countries");
      if (response.ok) {
        const data = await response.json();
        setCountries(data);
      }
    } catch (error) {
      console.error("Error loading countries:", error);
      toast({
        title: "Error",
        description: "Failed to load countries",
        variant: "destructive",
      });
    } finally {
      setLoadingCountries(false);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`/api/5sim/products?country=${selectedCountry}&operator=${selectedOperator}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        title: "Error", 
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadPrices = async () => {
    setLoadingPrices(true);
    try {
      const response = await fetch(`/api/5sim/prices?country=${selectedCountry}`);
      if (response.ok) {
        const data = await response.json();
        setPrices(data);
      }
    } catch (error) {
      console.error("Error loading prices:", error);
    } finally {
      setLoadingPrices(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedCountry || !selectedService) {
      toast({
        title: "Validation Error",
        description: "Please select country and service",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/numbers/purchase-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          countryCode: selectedCountry,
          service: selectedService,
          operator: selectedOperator,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          provider: "5sim",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Success!",
          description: `Successfully purchased ${data.phoneNumber}`,
        });
        onSuccess?.(data);
        onOpenChange(false);
        // Reset form
        setSelectedCountry("");
        setSelectedOperator("any");
        setSelectedService("");
        setMaxPrice("");
      } else {
        toast({
          title: "Purchase Failed",
          description: data.error || "Failed to purchase number",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableServices = () => {
    if (!products) return [];
    return Object.entries(products)
      .filter(([_, info]) => info.Qty > 0)
      .map(([service, info]) => ({
        service,
        category: info.Category,
        quantity: info.Qty,
        price: info.Price,
      }));
  };

  const getServicePrice = (service: string) => {
    const countryPrices = prices[selectedCountry] || {};
    const servicePrice = countryPrices[service];
    return servicePrice?.price || products[service]?.Price || 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Purchase Virtual Number (5sim.net)
          </DialogTitle>
          <DialogDescription>
            Get a virtual number for receiving SMS messages using 5sim.net API
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Balance Display */}
          {balance !== null && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Available Balance:</span>
                <span className="text-lg font-bold text-green-600">
                  {format(Number(balance))}
                </span>
              </div>
            </div>
          )}

          {/* Country Selection */}
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={selectedCountry}
              onValueChange={setSelectedCountry}
              disabled={loadingCountries}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.iso} value={country.iso}>
                    {country.text_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator Selection */}
          {selectedCountry && (
            <div className="space-y-2">
              <Label htmlFor="operator">Operator</Label>
              <Select
                value={selectedOperator}
                onValueChange={setSelectedOperator}
                disabled={loadingProducts}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Operator</SelectItem>
                  {countries
                    .find((c) => c.iso === selectedCountry)
                    ?.operators.map((operator) => (
                      <SelectItem key={operator} value={operator}>
                        {operator}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Service Selection */}
          {selectedCountry && selectedOperator && (
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              {loadingProducts ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading services...
                </div>
              ) : (
                <Select
                  value={selectedService}
                  onValueChange={setSelectedService}
                  disabled={loadingProducts}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableServices().map(({ service, category, quantity, price }) => (
                      <SelectItem key={service} value={service}>
                        <div className="flex items-center justify-between w-full">
                          <span className="capitalize">{service}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{quantity} available</span>
                            <span>•</span>
                            <span>{format(Number(price))}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Max Price */}
          <div className="space-y-2">
            <Label htmlFor="maxPrice">Maximum Price (Optional)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="maxPrice"
                type="number"
                step="0.01"
                placeholder="Enter maximum price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={loading || !selectedCountry || !selectedService}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Purchasing...
              </>
            ) : (
              "Purchase Number"
            )}
          </Button>

          {/* Price Preview */}
          {selectedService && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estimated Cost:</span>
                <span className="text-lg font-bold">
                  {format(Number(getServicePrice(selectedService)))}
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
