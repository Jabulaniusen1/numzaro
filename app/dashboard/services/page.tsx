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
import { Search, List, Users, Heart, MessageSquare, Eye, Share2, Bookmark, Radio, TrendingUp, Globe } from "lucide-react";
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
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");
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
      
      // Log all services data
      console.log("=== ALL SERVICES DATA ===");
      console.log("Total services:", servicesArray.length);
      console.log("Services array:", JSON.stringify(servicesArray, null, 2));
      servicesArray.forEach((service: Service, index: number) => {
        console.log(`\n--- Service ${index + 1} ---`);
        console.log("ID:", service.id);
        console.log("Service ID:", service.service_id);
        console.log("Name:", service.name);
        console.log("Category:", service.category);
        console.log("Type:", service.type);
        console.log("Rate:", service.rate);
        console.log("Min Quantity:", service.min_quantity);
        console.log("Max Quantity:", service.max_quantity);
        console.log("Refill Allowed:", service.refill_allowed);
        console.log("Cancel Allowed:", service.cancel_allowed);
        console.log("Full Service Object:", service);
      });
      console.log("\n=== FILTERS DATA ===");
      console.log("Categories:", data.filters?.categories || []);
      console.log("Types:", data.filters?.types || []);
      console.log("All Filters:", JSON.stringify(data.filters, null, 2));
      console.log("\n=== FULL API RESPONSE ===");
      console.log(JSON.stringify(data, null, 2));
      
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

  // Service type keywords mapping - more comprehensive
  const serviceTypeKeywords = {
    followers: [
      "followers", "follower", "subscribers", "subscriber", 
      "members", "member", "profile followers", "page followers"
    ],
    likes: [
      "likes", "like", "post likes", "page likes", "video likes",
      "photo likes", "reels likes"
    ],
    comments: [
      "comments", "comment", "custom comments", "random comments"
    ],
    views: [
      "views", "view", "video views", "plays", "play", 
      "listeners", "listener", "impressions", "impression",
      "story views", "reels views", "post views"
    ],
    shares: [
      "shares", "share", "post shares"
    ],
    saves: [
      "saves", "save", "video save"
    ],
    live: [
      "live", "livestream", "live stream", "broadcast",
      "live stream views", "live stream comments", "live services"
    ],
    reactions: [
      "reactions", "reaction", "emoticons", "emoticon",
      "post reactions", "comment reactions", "story reactions",
      "reels reactions"
    ],
    traffic: [
      "traffic", "visits", "visit", "website traffic"
    ],
    engagement: [
      "engagement", "statistics", "statistic", "poll", 
      "votes", "vote", "clicks"
    ],
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

    // Filter by service type (followers, likes, comments, etc.)
    if (selectedServiceType !== "all") {
      const keywords = serviceTypeKeywords[selectedServiceType as keyof typeof serviceTypeKeywords] || [];
      filtered = filtered.filter((service) => {
        const category = (service.category || "").toLowerCase();
        const name = (service.name || "").toLowerCase();
        const type = (service.type || "").toLowerCase();
        
        return keywords.some((keyword) => 
          category.includes(keyword) || 
          name.includes(keyword) || 
          type.includes(keyword)
        );
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
    
    return filtered;
  }, [services, searchQuery, selectedSocialMedia, selectedServiceType]);

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
    const categoryColors = [
      { bg: "from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30", border: "border-indigo-200 dark:border-indigo-800" },
      { bg: "from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30", border: "border-cyan-200 dark:border-cyan-800" },
      { bg: "from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30", border: "border-pink-200 dark:border-pink-800" },
    ];

    return (
      <div className="space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:via-cyan-500/20 dark:to-indigo-500/20 rounded-2xl blur-xl"></div>
          <div className="relative">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Services</h1>
            <p className="text-blue-700 dark:text-blue-300 mt-2 font-medium">Browse and order services</p>
          </div>
        </div>

        {/* Desktop Skeleton */}
        <div className="hidden md:block space-y-6">
          {[...Array(3)].map((_, categoryIndex) => {
            const colors = categoryColors[categoryIndex % categoryColors.length];
            return (
              <Card key={categoryIndex} className={`border-2 ${colors.border} bg-gradient-to-br ${colors.bg}`}>
                <CardHeader>
                  <Skeleton className="h-6 w-48 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                  <Skeleton className="h-4 w-32 mt-2 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                          <th className="text-left p-3 font-semibold">Name</th>
                          <th className="text-left p-3 font-semibold">Type</th>
                          <th className="text-right p-3 font-semibold">Price/1000</th>
                          <th className="text-right p-3 font-semibold">Min</th>
                          <th className="text-right p-3 font-semibold">Max</th>
                          <th className="text-center p-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...Array(3)].map((_, rowIndex) => (
                          <tr key={rowIndex} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="p-3">
                              <Skeleton className="h-5 w-48 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                              <div className="flex gap-1 mt-2">
                                <Skeleton className="h-5 w-12 bg-gradient-to-r from-green-200 to-green-100 dark:from-green-800 dark:to-green-700" />
                                <Skeleton className="h-5 w-14 bg-gradient-to-r from-blue-200 to-blue-100 dark:from-blue-800 dark:to-blue-700" />
                              </div>
                            </td>
                            <td className="p-3">
                              <Skeleton className="h-4 w-20 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                            </td>
                            <td className="p-3 text-right">
                              <Skeleton className="h-5 w-16 ml-auto bg-gradient-to-r from-primary/30 to-secondary/30 dark:from-primary/20 dark:to-secondary/20" />
                            </td>
                            <td className="p-3 text-right">
                              <Skeleton className="h-4 w-12 ml-auto bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                            </td>
                            <td className="p-3 text-right">
                              <Skeleton className="h-4 w-12 ml-auto bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                            </td>
                            <td className="p-3 text-center">
                              <Skeleton className="h-8 w-24 mx-auto bg-gradient-to-r from-primary/30 to-secondary/30 dark:from-primary/20 dark:to-secondary/20 rounded-md" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
            </div>
          </CardContent>
        </Card>
            );
          })}
        </div>

        {/* Mobile Skeleton */}
        <div className="md:hidden space-y-6">
          {[...Array(3)].map((_, categoryIndex) => {
            const colors = categoryColors[categoryIndex % categoryColors.length];
            return (
              <Card key={categoryIndex} className={`border-2 ${colors.border} bg-gradient-to-br ${colors.bg}`}>
                <CardHeader>
                  <Skeleton className="h-6 w-48 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                  <Skeleton className="h-4 w-32 mt-2 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(2)].map((_, serviceIndex) => (
                    <Card key={serviceIndex} className={`border-2 ${colors.border.replace('200', '300').replace('800', '700')} bg-gradient-to-br ${colors.bg.replace('50', '100').replace('950', '900')}`}>
                      <CardHeader>
                        <Skeleton className="h-5 w-full bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                        <Skeleton className="h-4 w-32 mt-2 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-12 bg-gradient-to-r from-green-200 to-green-100 dark:from-green-800 dark:to-green-700 rounded-full" />
                          <Skeleton className="h-5 w-14 bg-gradient-to-r from-blue-200 to-blue-100 dark:from-blue-800 dark:to-blue-700 rounded-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Skeleton className="h-3 w-20 mb-2 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                            <Skeleton className="h-5 w-24 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                          </div>
                          <div>
                            <Skeleton className="h-3 w-16 mb-2 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                            <Skeleton className="h-5 w-28 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                          </div>
                        </div>
                        <Skeleton className="h-10 w-full bg-gradient-to-r from-primary/30 to-secondary/30 dark:from-primary/20 dark:to-secondary/20 rounded-md" />
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:via-cyan-500/20 dark:to-indigo-500/20 rounded-2xl blur-xl"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Services</h1>
          <p className="text-blue-700 dark:text-blue-300 mt-2 font-medium">Browse and order services</p>
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

      {/* Social Media Filters */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-3 text-blue-900 dark:text-blue-100">Platform</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {socialMediaPlatforms.map((platform) => {
              const IconComponent = platform.icon;
              const isSelected = selectedSocialMedia === platform.id;
              const isGradient = platform.color.startsWith("linear-gradient");
              // Platforms that need black text (light backgrounds)
              const needsBlackText = ["snapchat", "boomplay", "audiomack"].includes(platform.id);
              const textColor = needsBlackText ? "black" : "white";
              
              return (
                <Button
                  key={platform.id}
                  variant="outline"
                  size={isSelected ? "default" : "sm"}
                  onClick={() => setSelectedSocialMedia(platform.id)}
                  style={
                    isGradient
                        ? {
                            background: platform.color,
                          color: textColor,
                            border: "none",
                          opacity: isSelected ? 1 : 0.8,
                          transform: isSelected ? "scale(1.1)" : "scale(1)",
                          transition: "all 0.2s ease",
                          }
                        : {
                            backgroundColor: platform.color,
                          color: textColor,
                            border: "none",
                          opacity: isSelected ? 1 : 0.8,
                          transform: isSelected ? "scale(1.1)" : "scale(1)",
                          transition: "all 0.2s ease",
                        }
                  }
                  className="hover:opacity-100 hover:scale-105 transition-all"
                  onMouseEnter={(e) => {
                      if (isGradient) {
                      e.currentTarget.style.opacity = "1";
                      } else {
                        const color = platform.color;
                        if (color === "#000000") {
                          e.currentTarget.style.backgroundColor = "#333333";
                        } else {
                        e.currentTarget.style.filter = "brightness(1.1)";
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                      if (isGradient) {
                      e.currentTarget.style.opacity = isSelected ? "1" : "0.8";
                      } else {
                        e.currentTarget.style.filter = "brightness(1)";
                        e.currentTarget.style.backgroundColor = platform.color;
                    }
                  }}
                >
                  <IconComponent className={`${isSelected ? "h-5 w-5" : "h-4 w-4"} mr-1`} />
                  {platform.name}
                </Button>
              );
            })}
                    </div>
        </CardContent>
      </Card>

      {/* Search and Dropdown Filters */}
      <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Advanced Filters</h3>
            {(selectedSocialMedia !== "all" || selectedServiceType !== "all" || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSocialMedia("all");
                  setSelectedServiceType("all");
                  setSearchQuery("");
                }}
                className="text-xs"
              >
                Clear All Filters
              </Button>
            )}
          </div>
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
              value={selectedServiceType}
              onValueChange={(value) => {
                setSelectedServiceType(value);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Service Types</SelectItem>
                <SelectItem value="followers">Followers</SelectItem>
                <SelectItem value="likes">Likes</SelectItem>
                <SelectItem value="comments">Comments</SelectItem>
                <SelectItem value="views">Views</SelectItem>
                <SelectItem value="shares">Shares</SelectItem>
                <SelectItem value="saves">Saves</SelectItem>
                <SelectItem value="live">Live Stream</SelectItem>
                <SelectItem value="reactions">Reactions</SelectItem>
                <SelectItem value="traffic">Traffic</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
              </SelectContent>
            </Select>
              </div>
        </CardContent>
      </Card>

      {/* Services by Category (Desktop) */}
      {!loading && (
        <div className="hidden md:block space-y-6">
          {groupedServices.length === 0 ? (
            <Card className="border-2 border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30">
              <CardContent className="pt-6">
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No services found</p>
              </CardContent>
            </Card>
          ) : (
            groupedServices.map(([category, categoryServices], index) => {
              const categoryColors = [
                { bg: "from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30", border: "border-indigo-200 dark:border-indigo-800", title: "text-indigo-900 dark:text-indigo-100", desc: "text-indigo-700 dark:text-indigo-300" },
                { bg: "from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30", border: "border-cyan-200 dark:border-cyan-800", title: "text-cyan-900 dark:text-cyan-100", desc: "text-cyan-700 dark:text-cyan-300" },
                { bg: "from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30", border: "border-pink-200 dark:border-pink-800", title: "text-pink-900 dark:text-pink-100", desc: "text-pink-700 dark:text-pink-300" },
                { bg: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30", border: "border-emerald-200 dark:border-emerald-800", title: "text-emerald-900 dark:text-emerald-100", desc: "text-emerald-700 dark:text-emerald-300" },
                { bg: "from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30", border: "border-violet-200 dark:border-violet-800", title: "text-violet-900 dark:text-violet-100", desc: "text-violet-700 dark:text-violet-300" },
                { bg: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30", border: "border-amber-200 dark:border-amber-800", title: "text-amber-900 dark:text-amber-100", desc: "text-amber-700 dark:text-amber-300" },
              ];
              const colors = categoryColors[index % categoryColors.length];
              
              return (
                <Card key={category} className={`border-2 ${colors.border} bg-gradient-to-br ${colors.bg} hover:shadow-xl transition-all`}>
                <CardHeader>
                    <CardTitle className={colors.title}>{category}</CardTitle>
                    <CardDescription className={colors.desc}>
                    {categoryServices.length} service{categoryServices.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                          <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                            <th className="text-left p-3 font-semibold">Name</th>
                            <th className="text-left p-3 font-semibold">Type</th>
                            <th className="text-right p-3 font-semibold">Price/1000</th>
                            <th className="text-right p-3 font-semibold">Min</th>
                            <th className="text-right p-3 font-semibold">Max</th>
                            <th className="text-center p-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryServices.map((service) => (
                            <tr key={service.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors">
                              <td className="p-3">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{service.name}</div>
                              <div className="flex gap-1 mt-1">
                                {service.refill_allowed && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                    Refill
                                  </Badge>
                                )}
                                {service.cancel_allowed && (
                                    <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                    Cancel
                                  </Badge>
                                )}
            </div>
                            </td>
                              <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                              {service.type || "-"}
                            </td>
                              <td className="p-3 text-right font-semibold text-primary">
                              {format(service.rate)}
                            </td>
                              <td className="p-3 text-right text-sm text-gray-600 dark:text-gray-400">
                              {service.min_quantity.toLocaleString()}
                            </td>
                              <td className="p-3 text-right text-sm text-gray-600 dark:text-gray-400">
                              {service.max_quantity.toLocaleString()}
                            </td>
                              <td className="p-3 text-center">
                              <Button
                                size="sm"
                                onClick={() => handleOrderClick(service)}
                                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white"
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
              );
            })
          )}
          </div>
      )}

      {/* Services by Category (Mobile) */}
      {!loading && (
        <div className="md:hidden space-y-6">
          {groupedServices.length === 0 ? (
            <Card className="border-2 border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30">
              <CardContent className="pt-6">
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No services found</p>
              </CardContent>
            </Card>
          ) : (
            groupedServices.map(([category, categoryServices], index) => {
              const categoryColors = [
                { bg: "from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30", border: "border-indigo-200 dark:border-indigo-800", title: "text-indigo-900 dark:text-indigo-100", desc: "text-indigo-700 dark:text-indigo-300", cardBg: "from-indigo-100/50 to-purple-100/50 dark:from-indigo-900/20 dark:to-purple-900/20", cardBorder: "border-indigo-300 dark:border-indigo-700" },
                { bg: "from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30", border: "border-cyan-200 dark:border-cyan-800", title: "text-cyan-900 dark:text-cyan-100", desc: "text-cyan-700 dark:text-cyan-300", cardBg: "from-cyan-100/50 to-blue-100/50 dark:from-cyan-900/20 dark:to-blue-900/20", cardBorder: "border-cyan-300 dark:border-cyan-700" },
                { bg: "from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30", border: "border-pink-200 dark:border-pink-800", title: "text-pink-900 dark:text-pink-100", desc: "text-pink-700 dark:text-pink-300", cardBg: "from-pink-100/50 to-rose-100/50 dark:from-pink-900/20 dark:to-rose-900/20", cardBorder: "border-pink-300 dark:border-pink-700" },
                { bg: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30", border: "border-emerald-200 dark:border-emerald-800", title: "text-emerald-900 dark:text-emerald-100", desc: "text-emerald-700 dark:text-emerald-300", cardBg: "from-emerald-100/50 to-teal-100/50 dark:from-emerald-900/20 dark:to-teal-900/20", cardBorder: "border-emerald-300 dark:border-emerald-700" },
                { bg: "from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30", border: "border-violet-200 dark:border-violet-800", title: "text-violet-900 dark:text-violet-100", desc: "text-violet-700 dark:text-violet-300", cardBg: "from-violet-100/50 to-fuchsia-100/50 dark:from-violet-900/20 dark:to-fuchsia-900/20", cardBorder: "border-violet-300 dark:border-violet-700" },
                { bg: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30", border: "border-amber-200 dark:border-amber-800", title: "text-amber-900 dark:text-amber-100", desc: "text-amber-700 dark:text-amber-300", cardBg: "from-amber-100/50 to-yellow-100/50 dark:from-amber-900/20 dark:to-yellow-900/20", cardBorder: "border-amber-300 dark:border-amber-700" },
              ];
              const colors = categoryColors[index % categoryColors.length];
              
              return (
                <Card key={category} className={`border-2 ${colors.border} bg-gradient-to-br ${colors.bg} hover:shadow-xl transition-all`}>
                <CardHeader>
                    <CardTitle className={`text-xl ${colors.title}`}>{category}</CardTitle>
                    <CardDescription className={colors.desc}>
                    {categoryServices.length} service{categoryServices.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categoryServices.map((service) => (
                      <Card key={service.id} className={`border-2 ${colors.cardBorder} bg-gradient-to-br ${colors.cardBg} hover:shadow-lg transition-all`}>
                      <CardHeader>
                          <CardTitle className={`text-lg ${colors.title}`}>{service.name}</CardTitle>
                          <CardDescription className={colors.desc}>
                          {service.type || ""}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2 flex-wrap">
                          {service.refill_allowed && (
                              <Badge className="bg-green-500 text-white hover:bg-green-600">Refill</Badge>
                          )}
                          {service.cancel_allowed && (
                              <Badge className="bg-blue-500 text-white hover:bg-blue-600">Cancel</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Price/1000</p>
                              <p className={`font-semibold text-lg ${colors.title}`}>{format(service.rate)}</p>
                          </div>
          <div>
                            <p className="text-gray-600 dark:text-gray-400">Quantity</p>
                              <p className={`font-semibold ${colors.title}`}>
                              {service.min_quantity.toLocaleString()} - {service.max_quantity.toLocaleString()}
                </p>
              </div>
                        </div>

                        <Button
                            className={`w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold`}
                          onClick={() => handleOrderClick(service)}
                        >
                          Order Now
                        </Button>
            </CardContent>
          </Card>
                  ))}
        </CardContent>
      </Card>
              );
            })
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
