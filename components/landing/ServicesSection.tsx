"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch services from public API (we'll create this)
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredServices(services);
    } else {
      setFilteredServices(services.filter((s) => s.category === selectedCategory));
    }
  }, [selectedCategory, services]);

  const fetchServices = async () => {
    try {
      // Try to fetch from public endpoint first
      const response = await fetch("/api/services/public");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setServices(data);
          const cats = Array.from(new Set(data.map((s: Service) => s.category))).filter(Boolean) as string[];
          setCategories(cats);
          setFilteredServices(data);
        }
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      // Fallback to sample data
      const sampleServices: Service[] = [
        {
          id: 1,
          service_id: 1,
          name: "Instagram Followers",
          category: "Instagram",
          type: "Followers",
          rate: 0.90,
          min_quantity: 50,
          max_quantity: 10000,
          refill_allowed: true,
          cancel_allowed: true,
        },
        {
          id: 2,
          service_id: 2,
          name: "Instagram Likes",
          category: "Instagram",
          type: "Likes",
          rate: 1.20,
          min_quantity: 50,
          max_quantity: 5000,
          refill_allowed: false,
          cancel_allowed: true,
        },
        {
          id: 3,
          service_id: 3,
          name: "Twitter Followers",
          category: "Twitter",
          type: "Followers",
          rate: 0.95,
          min_quantity: 100,
          max_quantity: 10000,
          refill_allowed: true,
          cancel_allowed: true,
        },
        {
          id: 4,
          service_id: 4,
          name: "TikTok Followers",
          category: "TikTok",
          type: "Followers",
          rate: 1.10,
          min_quantity: 100,
          max_quantity: 10000,
          refill_allowed: true,
          cancel_allowed: false,
        },
        {
          id: 5,
          service_id: 5,
          name: "YouTube Subscribers",
          category: "YouTube",
          type: "Subscribers",
          rate: 2.50,
          min_quantity: 50,
          max_quantity: 5000,
          refill_allowed: true,
          cancel_allowed: true,
        },
      ];
      setServices(sampleServices);
      const cats = Array.from(new Set(sampleServices.map((s) => s.category))).filter(Boolean);
      setCategories(cats as string[]);
      setFilteredServices(sampleServices);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Our Services
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose from our range of social media growth services
        </p>
      </div>

      {/* Dropdown Selector */}
      <div className="max-w-2xl mx-auto mb-12">
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Service Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
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
            </div>
            <div className="flex items-end">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading services...</p>
        </div>
      ) : filteredServices.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className="border-2 hover:border-[#1877F2] transition-all duration-300 hover:shadow-xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-bl-full opacity-50"></div>
              <CardHeader className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <Badge variant="outline">{service.category}</Badge>
                </div>
                <CardTitle className="text-2xl">{service.name}</CardTitle>
                <CardDescription className="text-base">{service.type}</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="mb-4">
                  <span className="text-4xl font-bold text-[#1877F2]">
                    ${Number(service.rate ?? 0).toFixed(2)}
                  </span>
                  <span className="text-gray-600 ml-2">per 1000</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Min: {(service.min_quantity ?? 100).toLocaleString()} • Max: {(service.max_quantity ?? 10000).toLocaleString()}
                </p>
                <div className="flex gap-2 mb-4">
                  {service.refill_allowed && (
                    <Badge variant="secondary" className="text-xs">Refill</Badge>
                  )}
                  {service.cancel_allowed && (
                    <Badge variant="secondary" className="text-xs">Cancel</Badge>
                  )}
                </div>
                <Link href="/auth/signup">
                  <Button className="w-full">Order Now</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No services found in this category.</p>
        </div>
      )}
    </section>
  );
}

