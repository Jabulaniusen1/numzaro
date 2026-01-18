"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderForm } from "@/components/dashboard/OrderForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, List } from "lucide-react";
import { FaFacebook, FaInstagram, FaTiktok, FaTelegram, FaReddit, FaLinkedin, FaSpotify, FaYoutube, FaMusic, FaApple, FaSnapchat } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedSocialMedia, setSelectedSocialMedia] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const { toast } = useToast();
  const { format } = useCurrency();

  // Social media platforms mapping with brand colors
  const socialMediaPlatforms = [
    { id: "all", name: "All", icon: List, color: "#3B82F6" },
    { id: "facebook", name: "Facebook", icon: FaFacebook, color: "#1877F2" },
    { id: "instagram", name: "Instagram", icon: FaInstagram, color: "linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)" },
    { id: "twitter", name: "X", icon: FaXTwitter, color: "#000000" },
    { id: "tiktok", name: "Tiktok", icon: FaTiktok, color: "#000000" },
    { id: "telegram", name: "Telegram", icon: FaTelegram, color: "#0088cc" },
    { id: "reddit", name: "Reddit", icon: FaReddit, color: "#FF4500" },
    { id: "linkedin", name: "LinkedIn", icon: FaLinkedin, color: "#0077B5" },
    { id: "spotify", name: "Spotify", icon: FaSpotify, color: "#1DB954" },
    { id: "youtube", name: "YouTube", icon: FaYoutube, color: "#FF0000" },
    { id: "audiomack", name: "Audiomack", icon: FaMusic, color: "#FFA500" },
    { id: "boomplay", name: "Boomplay", icon: FaMusic, color: "#00FFFF" },
    { id: "applemusic", name: "Apple Music", icon: FaApple, color: "#FF4E6B" },
    { id: "snapchat", name: "Snapchat", icon: FaSnapchat, color: "#FFFC00" },
  ];

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedType]);

  const fetchServices = async () => {
    console.log("fetchServices called");
    try {
      setLoading(true);
      setError(null);
      console.log("Loading set to true");

      const params = new URLSearchParams();

      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }

      if (selectedType !== "all") {
        params.append("type", selectedType);
      }
      
      console.log("Fetching services from:", `/api/services?${params.toString()}`);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`/api/services?${params.toString()}`, {
        signal: controller.signal
      }).catch((fetchError) => {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error("Request timeout after 30 seconds");
          throw new Error("Request timeout. The server is taking too long to respond.");
        }
        console.error("Network error fetching services:", fetchError);
        throw new Error(`Network error: ${fetchError.message}`);
      });
      
      clearTimeout(timeoutId);

      console.log("Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error("API error response:", errorData);
        throw new Error(errorData.error || errorData.details || `Failed to fetch services: ${response.status}`);
      }

      const data = await response.json().catch((parseError) => {
        console.error("Error parsing JSON response:", parseError);
        throw new Error("Invalid JSON response from server");
      });
      
      console.log("=== Services API Response ===");
      console.log("Full response:", JSON.stringify(data, null, 2));
      console.log("Services array:", data.services);
      console.log("Services count:", data.services?.length || 0);
      if (data.services && data.services.length > 0) {
        console.log("First service:", data.services[0]);
      }
      console.log("Pagination:", data.pagination);
      console.log("Filters:", data.filters);
      
      const servicesArray = Array.isArray(data.services) ? data.services : [];
      console.log("Setting services array with length:", servicesArray.length);
      
      setServices(servicesArray);
      setCategories(data.filters?.categories || []);
      setTypes(data.filters?.types || []);
      
      console.log("State updated - loading will be set to false");
    } catch (err: any) {
      console.error("=== Error fetching services ===");
      console.error("Error details:", err);
      console.error("Error message:", err.message);
      setError(err.message || "Failed to fetch services");
      setServices([]); // Clear services on error
      toast({
        title: "Error",
        description: err.message || "Failed to load services. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log("Finally block executed - setting loading to false");
      setLoading(false);
      console.log("Loading state set to false");
    }
  };

  // Filter services by search query and social media
  const filteredServices = useMemo(() => {
    let filtered = services;

    // Filter by social media (category contains the social media name)
    if (selectedSocialMedia !== "all") {
      const socialMediaName = selectedSocialMedia.toLowerCase();
      filtered = filtered.filter((service) => {
        const category = (service.category || "").toLowerCase();
        return category.includes(socialMediaName);
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(query) ||
          service.category?.toLowerCase().includes(query) ||
          service.type?.toLowerCase().includes(query)
      );
    }

    // Filter by category dropdown
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (service) => service.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by type dropdown
    if (selectedType !== "all") {
      filtered = filtered.filter(
        (service) => service.type?.toLowerCase() === selectedType.toLowerCase()
      );
    }
    
    return filtered;
  }, [services, searchQuery, selectedSocialMedia, selectedCategory, selectedType]);

  // Group services by category
  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    
    filteredServices.forEach((service) => {
      const category = service.category || "Uncategorized";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(service);
    });

    // Sort categories alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredServices]);

  const handleOrderClick = (service: Service) => {
    setSelectedService(service);
    setOrderDialogOpen(true);
  };

  const handleOrderSuccess = () => {
    setOrderDialogOpen(false);
    setSelectedService(null);
    // Optionally refresh services
    fetchServices();
  };

  if (loading && services.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-gray-600 mt-2">Browse and order services</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Services</h1>
        <p className="text-gray-600 mt-2">Browse and order services</p>
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

      {/* Social Media Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {socialMediaPlatforms.map((platform) => {
              const IconComponent = platform.icon;
              const isSelected = selectedSocialMedia === platform.id;
              const isGradient = platform.color.startsWith("linear-gradient");
              
              // Helper function to darken color for hover
              const darkenColor = (color: string) => {
                if (isGradient) return color; // Keep gradient as is
                if (color === "#000000") return "#333333";
                // Simple darken by reducing lightness (approximate)
                return color;
              };
              
              return (
                <Button
                  key={platform.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSocialMedia(platform.id)}
                  style={
                    isSelected
                      ? isGradient
                        ? {
                            background: platform.color,
                            color: "white",
                            border: "none",
                          }
                        : {
                            backgroundColor: platform.color,
                            color: "white",
                            border: "none",
                          }
                      : undefined
                  }
                  className={
                    isSelected
                      ? "hover:opacity-90 [&]:bg-transparent [&]:border-none"
                      : ""
                  }
                  onMouseEnter={(e) => {
                    if (isSelected) {
                      if (isGradient) {
                        e.currentTarget.style.opacity = "0.9";
                      } else {
                        // Darken the color slightly for hover
                        const color = platform.color;
                        if (color === "#000000") {
                          e.currentTarget.style.backgroundColor = "#333333";
                        } else {
                          e.currentTarget.style.filter = "brightness(0.9)";
                        }
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isSelected) {
                      if (isGradient) {
                        e.currentTarget.style.opacity = "1";
                      } else {
                        e.currentTarget.style.filter = "brightness(1)";
                        e.currentTarget.style.backgroundColor = platform.color;
                      }
                    }
                  }}
                >
                  <IconComponent className="mr-1 h-4 w-4" />
                  {platform.name}
                </Button>
              );
            })}
                    </div>
        </CardContent>
      </Card>

      {/* Search and Dropdown Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
          </div>

            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedType}
              onValueChange={(value) => {
                setSelectedType(value);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              </div>
        </CardContent>
      </Card>

      {/* Services by Category (Desktop) */}
      {!loading && (
        <div className="hidden md:block space-y-6">
          {groupedServices.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500 py-8">No services found</p>
              </CardContent>
            </Card>
          ) : (
            groupedServices.map(([category, categoryServices]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                  <CardDescription>
                    {categoryServices.length} service{categoryServices.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-right p-2">Price/1000</th>
                          <th className="text-right p-2">Min</th>
                          <th className="text-right p-2">Max</th>
                          <th className="text-center p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryServices.map((service) => (
                          <tr key={service.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2">
                              <div className="font-medium">{service.name}</div>
                              <div className="flex gap-1 mt-1">
                                {service.refill_allowed && (
                                  <Badge variant="secondary" className="text-xs">
                                    Refill
                                  </Badge>
                                )}
                                {service.cancel_allowed && (
                                  <Badge variant="secondary" className="text-xs">
                                    Cancel
                                  </Badge>
                                )}
            </div>
                            </td>
                            <td className="p-2 text-sm text-gray-600 dark:text-gray-400">
                              {service.type || "-"}
                            </td>
                            <td className="p-2 text-right font-medium">
                              {format(service.rate)}
                            </td>
                            <td className="p-2 text-right text-sm">
                              {service.min_quantity.toLocaleString()}
                            </td>
                            <td className="p-2 text-right text-sm">
                              {service.max_quantity.toLocaleString()}
                            </td>
                            <td className="p-2 text-center">
                              <Button
                                size="sm"
                                onClick={() => handleOrderClick(service)}
                              >
                                Order Now
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
            </div>
                </CardContent>
              </Card>
            ))
          )}
          </div>
      )}

      {/* Services by Category (Mobile) */}
      {!loading && (
        <div className="md:hidden space-y-6">
          {groupedServices.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500 py-8">No services found</p>
              </CardContent>
            </Card>
          ) : (
            groupedServices.map(([category, categoryServices]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-xl">{category}</CardTitle>
                  <CardDescription>
                    {categoryServices.length} service{categoryServices.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categoryServices.map((service) => (
                    <Card key={service.id} className="border">
                      <CardHeader>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <CardDescription>
                          {service.type || ""}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2 flex-wrap">
                          {service.refill_allowed && (
                            <Badge variant="secondary">Refill</Badge>
                          )}
                          {service.cancel_allowed && (
                            <Badge variant="secondary">Cancel</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Price/1000</p>
                            <p className="font-semibold">{format(service.rate)}</p>
                          </div>
          <div>
                            <p className="text-gray-600 dark:text-gray-400">Quantity</p>
                            <p className="font-semibold">
                              {service.min_quantity.toLocaleString()} - {service.max_quantity.toLocaleString()}
                </p>
              </div>
                        </div>

                        <Button
                          className="w-full"
                          onClick={() => handleOrderClick(service)}
                        >
                          Order Now
                        </Button>
            </CardContent>
          </Card>
                  ))}
        </CardContent>
      </Card>
            ))
          )}
        </div>
      )}

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Order</DialogTitle>
            <DialogDescription>
              Enter the details for your order
            </DialogDescription>
          </DialogHeader>
          {selectedService && (
            <OrderForm
              service={selectedService}
              onSuccess={handleOrderSuccess}
              onCancel={() => setOrderDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
