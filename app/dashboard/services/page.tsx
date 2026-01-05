"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/lib/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/lib/hooks/use-currency";

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

// Platform mapping based on API available platforms
const PLATFORM_MAPPING = {
  "Facebook": ["facebook", "fb"],
  "Instagram": ["instagram", "ig"],
  "TikTok": ["tiktok", "tik tok"],
  "WhatsApp": ["whatsapp", "wa"],
  "YouTube": ["youtube", "yt"],
  "Telegram": ["telegram", "tg"],
  "X": ["twitter", "x.com", "x "],
  "Potato Chat": ["potato", "potato chat"],
} as const;

// Service types by platform
const PLATFORM_SERVICE_TYPES: Record<string, string[]> = {
  "Facebook": ["Followers", "Page Likes", "Post Likes", "Post Shares", "Post Comments"],
  "Instagram": ["Followers", "Likes", "Video Views", "Video Likes", "Comments", "Saves", "Shares"],
  "TikTok": ["Followers", "Likes", "Views", "Shares", "Comments"],
  "WhatsApp": ["Group Members", "Channel Members"],
  "YouTube": ["Subscribers", "Views", "Likes", "Comments"],
  "Telegram": ["Channel Members", "Group Members"],
  "X": ["Followers", "Likes", "Retweets", "Replies"],
  "Potato Chat": ["Members"],
};

// Get service types for selected platform
const getServiceTypesForPlatform = (platform: string): string[] => {
  return PLATFORM_SERVICE_TYPES[platform] || [];
};

const QUALITY_OPTIONS = ["High Quality", "Average"] as const;

export default function ServicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { format, loading: currencyLoading } = useCurrency();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [selectedQuality, setSelectedQuality] = useState<string>("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [customComments, setCustomComments] = useState("");
  const [processing, setProcessing] = useState(false);

  // Reset dependent fields when platform changes
  useEffect(() => {
    console.log("Platform changed to:", selectedPlatform);
    if (!selectedPlatform) {
      setSelectedServiceType("");
      setSelectedQuality("");
      setLink("");
    }
  }, [selectedPlatform]);

  // Reset quality when service type changes
  useEffect(() => {
    if (!selectedServiceType) {
      setSelectedQuality("");
    }
  }, [selectedServiceType]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch("/api/services");
      const data = await response.json();
      
      if (response.ok) {
        if (Array.isArray(data)) {
          const normalizedServices = data.map((service: any) => ({
            id: service.id || service.service_id,
            service_id: service.service_id || service.id,
            name: service.name || "Unknown Service",
            category: service.category || "Uncategorized",
            type: service.type || "Default",
            rate: Number(service.rate) || 0,
            min_quantity: Number(service.min_quantity) || 100,
            max_quantity: Number(service.max_quantity) || 10000,
            refill_allowed: Boolean(service.refill_allowed),
            cancel_allowed: Boolean(service.cancel_allowed),
          }));
          setServices(normalizedServices);
        } else {
          setError(data.error || "Invalid response format");
        }
      } else {
        if (response.status === 401) {
          setError("Please sign in to view services");
        } else {
          setError(data.error || data.details || "Failed to fetch services");
        }
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Map platform names to match service categories
  const mapPlatform = useCallback((category: string, serviceName: string): string | null => {
    const lowerCategory = category.toLowerCase();
    const lowerName = serviceName.toLowerCase();
    const combined = `${lowerCategory} ${lowerName}`;
    
    console.log("Mapping platform:", { category, serviceName, combined });
    
    // First, check for exact platform name matches (most specific)
    for (const [platform, keywords] of Object.entries(PLATFORM_MAPPING)) {
      const platformLower = platform.toLowerCase();
      // Check if platform name appears directly in category or name
      if (lowerCategory === platformLower || lowerName.includes(platformLower)) {
        console.log(`Exact platform match: ${platform} for service: ${serviceName}`);
        return platform;
      }
    }
    
    // Then check keywords, but prioritize longer/more specific keywords first
    // Sort platforms by keyword length (longer = more specific)
    const sortedPlatforms = Object.entries(PLATFORM_MAPPING).sort((a, b) => {
      const aMaxLength = Math.max(...a[1].map(k => k.length));
      const bMaxLength = Math.max(...b[1].map(k => k.length));
      return bMaxLength - aMaxLength;
    });
    
    for (const [platform, keywords] of sortedPlatforms) {
      // Check if any keyword matches as a whole word (not substring)
      const matchedKeyword = keywords.find(keyword => {
        const keywordLower = keyword.toLowerCase();
        // Match as whole word or at word boundaries
        const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(combined);
      });
      
      if (matchedKeyword) {
        console.log(`Keyword match: ${platform} (keyword: ${matchedKeyword}) for service: ${serviceName}`);
        return platform;
      }
    }
    
    console.log(`No platform match found for: ${serviceName}`);
    return null;
  }, []);

  // Get available platforms from services
  const availablePlatforms = useMemo(() => {
    const platforms = new Set<string>();
    services.forEach((service) => {
      const mappedPlatform = mapPlatform(service.category, service.name);
      if (mappedPlatform) {
        platforms.add(mappedPlatform);
      }
    });
    return Array.from(platforms).sort();
  }, [services, mapPlatform]);

  // Get available service types for selected platform
  const availableServiceTypes = useMemo(() => {
    if (!selectedPlatform) return [];
    return getServiceTypesForPlatform(selectedPlatform);
  }, [selectedPlatform]);

  // Map service types to match user's desired categories based on platform
  const mapServiceType = useCallback((serviceType: string, serviceName: string, platform: string): string | null => {
    const lowerType = serviceType.toLowerCase();
    const lowerName = serviceName.toLowerCase();
    const combined = `${lowerType} ${lowerName}`;
    
    const platformTypes = getServiceTypesForPlatform(platform);
    if (platformTypes.length === 0) return null;

    // Try to match against platform-specific service types
    for (const type of platformTypes) {
      const lowerTypeName = type.toLowerCase();
      // Check if the service matches this type
      if (
        combined.includes(lowerTypeName) ||
        (lowerTypeName.includes("follower") && (combined.includes("follower") || combined.includes("follow"))) ||
        (lowerTypeName.includes("like") && combined.includes("like")) ||
        (lowerTypeName.includes("view") && combined.includes("view")) ||
        (lowerTypeName.includes("comment") && combined.includes("comment")) ||
        (lowerTypeName.includes("share") && combined.includes("share")) ||
        (lowerTypeName.includes("save") && combined.includes("save")) ||
        (lowerTypeName.includes("member") && (combined.includes("member") || combined.includes("subscriber")))
      ) {
        return type;
      }
    }
    
    return null;
  }, []);

  // Filter services based on platform, type and quality
  const filteredService = useMemo(() => {
    if (!selectedPlatform || !selectedServiceType || !selectedQuality) return null;

    console.log("Filtering services for:", { selectedPlatform, selectedServiceType, selectedQuality });

    // First, filter by platform
    const platformMatchingServices = services.filter((service) => {
      const mappedPlatform = mapPlatform(service.category, service.name);
      const matches = mappedPlatform === selectedPlatform;
      if (matches) {
        console.log("Platform match:", {
          serviceName: service.name,
          category: service.category,
          type: service.type,
          mappedPlatform: mappedPlatform,
          selectedPlatform: selectedPlatform
        });
      }
      return matches;
    });

    console.log(`Found ${platformMatchingServices.length} services matching platform "${selectedPlatform}"`);
    if (platformMatchingServices.length === 0) return null;

    // Then, filter by service type
    const typeMatchingServices = platformMatchingServices.filter((service) => {
      const mappedType = mapServiceType(service.type, service.name, selectedPlatform);
      const matches = mappedType === selectedServiceType;
      if (matches) {
        console.log("Type match:", {
          serviceName: service.name,
          serviceType: service.type,
          mappedType: mappedType,
          selectedServiceType: selectedServiceType
        });
      }
      return matches;
    });

    console.log(`Found ${typeMatchingServices.length} services matching type "${selectedServiceType}"`);
    if (typeMatchingServices.length === 0) return null;

    // Calculate average rate for this service type to determine quality threshold
    const avgRate = typeMatchingServices.reduce((sum, s) => sum + s.rate, 0) / typeMatchingServices.length;

    // Filter by quality
    const qualityMatchingServices = typeMatchingServices.filter((service) => {
      const lowerName = service.name.toLowerCase();
      const isHighQuality = 
        lowerName.includes("high") ||
        lowerName.includes("premium") ||
        lowerName.includes("quality") ||
        service.rate > avgRate * 1.1; // 10% above average

      if (selectedQuality === "High Quality") {
        return isHighQuality;
      } else {
        return !isHighQuality || service.rate <= avgRate * 1.1;
      }
    });

    // If no quality match, use all type matches and sort by quality preference
    const servicesToUse = qualityMatchingServices.length > 0 
      ? qualityMatchingServices 
      : typeMatchingServices;

    // Sort based on quality preference
    const finalService = servicesToUse.sort((a, b) => {
      if (selectedQuality === "High Quality") {
        return b.rate - a.rate; // Higher rate = higher quality
      } else {
        return a.rate - b.rate; // Lower rate = average quality
      }
    })[0];
    
    console.log("Final selected service:", {
      name: finalService?.name,
      category: finalService?.category,
      type: finalService?.type,
      rate: finalService?.rate
    });
    
    return finalService;
  }, [selectedPlatform, selectedServiceType, selectedQuality, services, mapPlatform, mapServiceType]);

  // Check if the selected service is Custom Comments
  const isCustomComments = useMemo(() => {
    if (!filteredService) return false;
    const serviceType = filteredService.type?.toLowerCase() || "";
    const serviceName = filteredService.name?.toLowerCase() || "";
    return serviceType.includes("custom") && serviceType.includes("comment") ||
           serviceName.includes("custom") && serviceName.includes("comment");
  }, [filteredService]);

  const calculateCharge = () => {
    if (!filteredService) return 0;
    return (filteredService.rate * quantity) / 1000;
  };

  const calculateChargeDisplay = () => {
    return calculateCharge(); // Returns USD amount, will be formatted by format() function
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!filteredService) {
      toast({
        title: "Service not selected",
        description: "Please select a service type and quality",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const minQty = filteredService.min_quantity ?? 100;
      const maxQty = filteredService.max_quantity ?? 10000;
      
      // Validate quantity
      if (quantity < minQty || quantity > maxQty) {
        toast({
          title: "Invalid quantity",
          description: `Quantity must be between ${minQty.toLocaleString()} and ${maxQty.toLocaleString()}`,
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      // Validate link
      if (!link || link.trim() === "") {
        toast({
          title: "Link required",
          description: "Please enter a valid social media link",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      // Validate custom comments if it's a custom comments service
      if (isCustomComments) {
        if (!customComments || customComments.trim() === "") {
          toast({
            title: "Custom comments required",
            description: "Please enter your custom comments (one per line)",
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }
        // Validate that number of comments matches quantity
        const commentLines = customComments.split('\n').filter(line => line.trim() !== "");
        if (commentLines.length !== quantity) {
          toast({
            title: "Comment count mismatch",
            description: `You entered ${quantity} as quantity but provided ${commentLines.length} comments. Please ensure the number of comments matches the quantity.`,
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }
      }

      // Create order (charges from wallet)
      const orderResponse = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: filteredService.service_id, // Use API service_id, not database id
          link: link.trim(),
          quantity: quantity,
          comments: isCustomComments ? customComments.trim() : undefined, // Send comments for custom comments services
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        // Show detailed error message if available
        const errorMessage = error.details || error.error || "Failed to create order";
        throw new Error(errorMessage);
      }

      const { order } = await orderResponse.json();

      toast({
        title: "Order created successfully",
        description: "Your order has been placed and will be processed shortly.",
      });

      // Reset form
      setLink("");
      setQuantity(100);
      setCustomComments("");
      setSelectedPlatform("");
      setSelectedServiceType("");
      setSelectedQuality("");

      // Refresh page to show updated wallet balance
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process order",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Order Services</h1>
        <p className="text-gray-600 mt-2">
          Select your service type and quality, then complete your order
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-800 font-medium">Error loading services</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
              <Button onClick={fetchServices} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select Service</CardTitle>
          <CardDescription>Choose your service type and quality</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Social Media Platform Icons */}
            <div className="space-y-2">
              <Label>Select Social Media Platform</Label>
              <div className="grid grid-cols-4 md:grid-cols-4 gap-4">
                {availablePlatforms.length > 0 ? (
                  availablePlatforms.map((platform) => {
                    const isSelected = selectedPlatform === platform;
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => {
                          console.log("Selected social media platform:", platform);
                          setSelectedPlatform(platform);
                        }}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-[#1877F2] bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {platform === "Facebook" && (
                          <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center mb-2">
                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </div>
                        )}
                        {platform === "Instagram" && (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center mb-2">
                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </div>
                        )}
                        {platform === "TikTok" && (
                          <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center mb-2">
                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                            </svg>
                          </div>
                        )}
                        {platform === "WhatsApp" && (
                          <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center mb-2">
                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                          </div>
                        )}
                        {platform === "YouTube" && (
                          <div className="w-12 h-12 rounded-full bg-[#FF0000] flex items-center justify-center mb-2">
                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          </div>
                        )}
                        {platform === "Telegram" && (
                          <div className="w-12 h-12 rounded-full bg-[#0088cc] flex items-center justify-center mb-2">
                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                          </div>
                        )}
                        {platform === "X" && (
                          <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center mb-2">
                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </div>
                        )}
                        {platform === "Potato Chat" && (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-2">
                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </div>
                        )}
                        <span className={`text-xs font-medium ${isSelected ? "text-[#1877F2]" : "text-gray-600"}`}>
                          {platform}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-4 text-center py-8 text-gray-500">
                    No platforms available. Please check back later.
                  </div>
                )}
              </div>
            </div>

            {/* Service Type Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="service-type">Service Type</Label>
              <Select 
                value={selectedServiceType} 
                onValueChange={setSelectedServiceType}
                disabled={!selectedPlatform || availableServiceTypes.length === 0}
              >
                <SelectTrigger id="service-type" className="w-full">
                  <SelectValue placeholder={selectedPlatform ? "Select service type" : "Select platform first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableServiceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPlatform && availableServiceTypes.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No service types available for {selectedPlatform}
                </p>
              )}
            </div>

            {/* Quality Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Select 
                value={selectedQuality} 
                onValueChange={setSelectedQuality}
                disabled={!selectedServiceType}
              >
                <SelectTrigger id="quality" className="w-full">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_OPTIONS.map((quality) => (
                    <SelectItem key={quality} value={quality}>
                      {quality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Details Display */}
            {filteredService && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Service:</span>
                    <span className="text-sm text-gray-900">{filteredService.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Rate:</span>
                    <span className="text-sm font-semibold text-[#1877F2]">
                      {currencyLoading ? "Loading..." : format(Number(filteredService.rate))} per 1000
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Quantity Range:</span>
                    <span className="text-sm text-gray-900">
                      {(filteredService.min_quantity ?? 100).toLocaleString()} - {(filteredService.max_quantity ?? 10000).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!filteredService && selectedPlatform && selectedServiceType && selectedQuality && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  No service found matching your selection. Please try a different combination.
                </p>
              </div>
            )}

            {/* Link Input */}
            <div className="space-y-2">
              <Label htmlFor="link">Social Media Link</Label>
              <Input
                id="link"
                type="url"
                placeholder="https://instagram.com/yourprofile"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
                disabled={!filteredService}
              />
            </div>

            {/* Quantity Input */}
            {filteredService && (
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantity ({(filteredService.min_quantity ?? 100).toLocaleString()} - {(filteredService.max_quantity ?? 10000).toLocaleString()})
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min={filteredService.min_quantity ?? 100}
                  max={filteredService.max_quantity ?? 10000}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  required
                />
                {isCustomComments && (
                  <p className="text-xs text-gray-500">
                    You need to enter exactly {quantity} comments (one per line)
                  </p>
                )}
              </div>
            )}

            {/* Custom Comments Input - Only show for Custom Comments services */}
            {filteredService && isCustomComments && (
              <div className="space-y-2">
                <Label htmlFor="custom-comments">
                  Custom Comments <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="custom-comments"
                  placeholder="Enter your comments, one per line. Each comment will be used once.&#10;Example:&#10;Great post!&#10;Love this!&#10;Amazing content!"
                  value={customComments}
                  onChange={(e) => setCustomComments(e.target.value)}
                  rows={8}
                  required
                  className="font-mono text-sm"
                />
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>
                    {customComments.split('\n').filter(line => line.trim() !== "").length} comment(s) entered
                  </span>
                  <span>
                    Required: {quantity} comment(s)
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  💡 Tip: Separate each comment by moving to a new line on your keyboard. Each comment will be used once.
                </p>
              </div>
            )}

            {/* Order Summary */}
            {filteredService && (
              <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Service:</span>
                    <span className="font-medium">{filteredService.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rate:</span>
                    <span className="font-medium">
                      {currencyLoading ? "Loading..." : format(Number(filteredService.rate))} per 1000
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quantity:</span>
                    <span className="font-medium">{quantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-[#1877F2]">
                      {currencyLoading ? "Loading..." : format(calculateCharge())}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!filteredService || processing}
            >
              {processing ? "Processing..." : "Complete Order"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
