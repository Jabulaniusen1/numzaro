"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { Combobox } from "@/components/ui/combobox";
import { Loader2, Info, Clock, DollarSign } from "lucide-react";

interface Service {
  id: number;
  service_id: number;
  name: string;
  category: string;
  type: string;
  rate: number;
  min_quantity: number;
  max_quantity: number;
  refill_allowed: boolean;
  cancel_allowed: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState<string>("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [categories, setCategories] = useState<string[]>([]);
  const { toast } = useToast();
  const { format } = useCurrency();

  useEffect(() => {
    fetchServices();
    fetchBalance();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/services");
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }

      const data = await response.json();
      setServices(data.services || []);
      setCategories(data.filters?.categories || []);
    } catch (err: any) {
      console.error("Error fetching services:", err);
      setError(err.message || "Failed to load services");
      toast({
        title: "Error",
        description: err.message || "Failed to load services. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/balance");
      if (response.ok) {
        const data = await response.json();
        setBalance(parseFloat(data.balance || "0"));
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  // Filter services by selected category
  const filteredServices = useMemo(() => {
    if (!selectedCategory) return [];
    return services.filter((service) => 
      service.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [services, selectedCategory]);

  // Get selected service details
  const selectedService = useMemo(() => {
    if (!selectedServiceId) return null;
    return services.find((s) => s.id.toString() === selectedServiceId) || null;
  }, [services, selectedServiceId]);

  // Check if service requires comments
  const isCommentService = () => {
    if (!selectedService) return false;
    const name = (selectedService.name || "").toLowerCase();
    const type = (selectedService.type || "").toLowerCase();
    const category = (selectedService.category || "").toLowerCase();
    return name.includes("comment") || type.includes("comment") || category.includes("comment");
  };

  // Calculate charge
  const calculateCharge = () => {
    if (!selectedService || !quantity) return 0;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) return 0;
    return (qty / 1000) * (selectedService.rate || 0);
  };

  const charge = calculateCharge();

  // Reset service selection when category changes
  useEffect(() => {
    setSelectedServiceId("");
    setQuantity("");
    setLink("");
    setComments("");
  }, [selectedCategory]);

  // Set default quantity when service is selected
  useEffect(() => {
    if (selectedService && !quantity) {
      setQuantity(String(selectedService.min_quantity || 100));
    }
  }, [selectedService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService) {
      toast({
        title: "Service required",
        description: "Please select a service",
        variant: "destructive",
      });
      return;
    }

    if (!link.trim()) {
      toast({
        title: "Link required",
        description: "Please enter a valid link",
        variant: "destructive",
      });
      return;
    }

    const qty = parseInt(quantity, 10);
    if (!quantity.trim() || isNaN(qty) || qty < selectedService.min_quantity || qty > selectedService.max_quantity) {
      toast({
        title: "Invalid quantity",
        description: `Quantity must be between ${selectedService.min_quantity.toLocaleString()} and ${selectedService.max_quantity.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    if (charge > balance) {
      toast({
        title: "Insufficient balance",
        description: `You need ${format(charge)} but only have ${format(balance)}. Please fund your wallet.`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          link: link.trim(),
          quantity: Math.floor(qty),
          ...(comments.trim() && { comments: comments.trim() }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      toast({
        title: "Order created successfully!",
        description: `Your order for ${selectedService.name} has been placed.`,
      });

      // Trigger balance update event
      window.dispatchEvent(new CustomEvent("balanceUpdated"));
      fetchBalance();

      // Reset form
      setLink("");
      setQuantity("");
      setComments("");
      setSelectedServiceId("");
      setSelectedCategory("");
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Order failed",
        description: error.message || "Failed to create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Estimate average time (placeholder - you can enhance this based on service type)
  const getAverageTime = () => {
    if (!selectedService) return "N/A";
    // Simple estimation based on service type
    const type = (selectedService.type || "").toLowerCase();
    if (type.includes("followers") || type.includes("subscribers")) {
      return "24-48 hours";
    } else if (type.includes("likes") || type.includes("views")) {
      return "1-6 hours";
    } else if (type.includes("comments")) {
      return "12-24 hours";
    }
    return "12-48 hours";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:via-cyan-500/20 dark:to-indigo-500/20 rounded-2xl blur-xl"></div>
          <div className="relative">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Services</h1>
            <p className="text-blue-700 dark:text-blue-300 mt-2 font-medium">Boost your social media presence</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:via-cyan-500/20 dark:to-indigo-500/20 rounded-2xl blur-xl"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Services</h1>
          <p className="text-blue-700 dark:text-blue-300 mt-2 font-medium">Boost your social media presence</p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardContent className="pt-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <Button
              variant="outline"
              onClick={fetchServices}
              className="mt-4"
            >
                Retry
              </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Create New Order</CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Select a category and service to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-base font-semibold">Category</Label>
              <Combobox
                options={categories.map((category) => ({
                  value: category,
                  label: category,
                }))}
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                placeholder="Select a category"
                searchPlaceholder="Search categories..."
                emptyMessage="No categories found"
                disabled={loading}
              />
          </div>

            {/* Service Selection */}
            <div className="space-y-2">
              <Label htmlFor="service" className="text-base font-semibold">Service</Label>
              <Combobox
                options={filteredServices.map((service) => ({
                  value: service.id.toString(),
                  label: service.name,
                }))}
                value={selectedServiceId}
                onValueChange={setSelectedServiceId}
                placeholder={!selectedCategory ? "Select a category first" : filteredServices.length === 0 ? "No services available" : "Select a service"}
                searchPlaceholder="Search services..."
                emptyMessage="No services found"
                disabled={!selectedCategory || filteredServices.length === 0 || loading}
              />
          </div>

            {/* Service Details */}
            <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardHeader>
                {selectedService ? (
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-purple-900 dark:text-purple-100">{selectedService.name}</CardTitle>
                      <CardDescription className="text-purple-700 dark:text-purple-300 mt-1">
                        {selectedService.category} • {selectedService.type}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {selectedService.refill_allowed && (
                        <Badge className="bg-green-500 text-white">Refill</Badge>
                      )}
                      {selectedService.cancel_allowed && (
                        <Badge className="bg-blue-500 text-white">Cancel</Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <CardTitle className="text-purple-900 dark:text-purple-100">Service Details</CardTitle>
                    <CardDescription className="text-purple-700 dark:text-purple-300 mt-1">
                      Select a service to view details
                    </CardDescription>
                  </div>
                )}
              </CardHeader>
              {selectedService && (
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Price per 1000:</span>
                      <p className="font-semibold text-lg text-purple-900 dark:text-purple-100">{format(selectedService.rate)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Quantity Range:</span>
                      <p className="font-semibold text-purple-900 dark:text-purple-100">
                        {selectedService.min_quantity.toLocaleString()} - {selectedService.max_quantity.toLocaleString()}
                      </p>
                    </div>
              </div>
        </CardContent>
              )}
            </Card>

            {/* Link Field */}
            <div className="space-y-2">
              <Label htmlFor="link" className="text-base font-semibold">Link</Label>
              <Input
                id="link"
                type="url"
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
                disabled={submitting || !selectedService}
              />
            </div>

            {/* Quantity Field */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-base font-semibold">
                Quantity {selectedService ? `(${selectedService.min_quantity.toLocaleString()} - ${selectedService.max_quantity.toLocaleString()})` : ""}
              </Label>
              <Input
                id="quantity"
                type="number"
                min={selectedService?.min_quantity}
                max={selectedService?.max_quantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onBlur={(e) => {
                  if (selectedService) {
                    const value = e.target.value.trim();
                    if (!value || isNaN(parseInt(value, 10))) {
                      setQuantity(String(selectedService.min_quantity || 100));
                    }
                  }
                }}
                placeholder={selectedService ? `Enter quantity between ${selectedService.min_quantity.toLocaleString()} - ${selectedService.max_quantity.toLocaleString()}` : "Select a service first"}
                required
                disabled={submitting || !selectedService}
              />
            </div>

            {/* Order Summary */}
            <Card className="border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>Average Time:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedService && quantity ? getAverageTime() : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <DollarSign className="h-4 w-4" />
                    <span>Total Charge:</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                      {charge > 0 ? format(charge) : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Your Balance:</span>
                    <span className={charge > balance ? "text-red-600 dark:text-red-400 font-semibold" : ""}>
                      {format(balance)}
                    </span>
                  </div>
          </div>
              </CardContent>
            </Card>

            {/* Comments Field */}
            <div className="space-y-2">
              <Label htmlFor="comments" className="text-base font-semibold">
                Custom Comments {selectedService && isCommentService() && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="comments"
                placeholder={selectedService && isCommentService() ? "Enter comments, one per line..." : "This service does not require comments"}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={6}
                disabled={submitting || (!selectedService || !isCommentService())}
                className="resize-none"
              />
              {selectedService && isCommentService() && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter each comment on a new line
                </p>
              )}
                        </div>

            {/* Submit Button */}
                        <Button
              type="submit" 
              disabled={submitting || !selectedService || charge > balance || !link.trim() || !quantity}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Order...
                </>
              ) : (
                "Submit Order"
              )}
                        </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
