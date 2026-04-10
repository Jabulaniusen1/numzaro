"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import Link from "next/link";
import { Users, Phone, Loader2, RefreshCw, Trash2 } from "lucide-react";

interface Stats {
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  totalOrders: number;
  thisMonthRevenue: number;
  thisMonthProfit: number;
  lastMonthRevenue: number;
  lastMonthProfit: number;
  recentOrders: any[];
}

interface AdminService {
  id: string | number;
  service_id: string | number;
  name: string;
  category: string;
  type: string;
  min_quantity: number;
  max_quantity: number;
  is_hidden?: boolean;
}

interface ApiServiceOption {
  service_id: number;
  name: string;
  category: string;
  type: string;
  min_quantity: number;
  max_quantity: number;
  exists_in_db: boolean;
  is_hidden: boolean;
}

export default function AdminPage() {
  const { toast } = useToast();
  const { format: formatCurrency, convert } = useCurrency();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [markup, setMarkup] = useState<number>(30);
  const [markupInput, setMarkupInput] = useState("30");
  const [updatingMarkup, setUpdatingMarkup] = useState(false);
  const [phoneMarkup, setPhoneMarkup] = useState<number>(400);
  const [phoneMarkupInput, setPhoneMarkupInput] = useState("400");
  const [updatingPhoneMarkup, setUpdatingPhoneMarkup] = useState(false);
  const [apiBalance, setApiBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [syncingServices, setSyncingServices] = useState(false);
  const [syncSelectedCategories, setSyncSelectedCategories] = useState<string[]>([]);
  const [syncCategorySearch, setSyncCategorySearch] = useState("");
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [apiTotal, setApiTotal] = useState<number | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [services, setServices] = useState<AdminService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesQuery, setServicesQuery] = useState("");
  const [deletingServiceId, setDeletingServiceId] = useState<string | number | null>(null);
  const [servicesTotal, setServicesTotal] = useState(0);
  const [servicesPage, setServicesPage] = useState(1);
  const [servicesTotalPages, setServicesTotalPages] = useState(1);
  const [markedServiceIds, setMarkedServiceIds] = useState<Array<string | number>>([]);
  const [updatingHidden, setUpdatingHidden] = useState(false);
  const [adminTab, setAdminTab] = useState("overview");
  const [apiServiceOptions, setApiServiceOptions] = useState<ApiServiceOption[]>([]);
  const [apiServicesLoading, setApiServicesLoading] = useState(false);
  const [apiServicesSearch, setApiServicesSearch] = useState("");
  const [apiServicesCategory, setApiServicesCategory] = useState("");
  const [apiServicesPage, setApiServicesPage] = useState(1);
  const [apiServicesTotal, setApiServicesTotal] = useState(0);
  const [apiServicesTotalPages, setApiServicesTotalPages] = useState(1);
  const [selectedApiServiceIds, setSelectedApiServiceIds] = useState<number[]>([]);
  const [addingSelectedServices, setAddingSelectedServices] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchMarkup();
    fetchPhoneMarkup();
    fetchApiBalance();
  }, []);

  useEffect(() => {
    setServicesPage(1);
  }, [servicesQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdminServices(servicesQuery, servicesPage);
    }, 300);
    return () => clearTimeout(timer);
  }, [servicesQuery, servicesPage]);

  useEffect(() => {
    setApiServicesPage(1);
  }, [apiServicesSearch, apiServicesCategory]);

  useEffect(() => {
    if (adminTab !== "services") return;
    const timer = setTimeout(() => {
      fetchSelectableApiServices(apiServicesSearch, apiServicesCategory, apiServicesPage);
    }, 300);
    return () => clearTimeout(timer);
  }, [adminTab, apiServicesSearch, apiServicesCategory, apiServicesPage]);

  useEffect(() => {
    if (adminTab !== "services") return;
    if (apiCategories.length > 0 || loadingCategories) return;
    fetchApiCategories();
  }, [adminTab, apiCategories.length, loadingCategories]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarkup = async () => {
    try {
      const response = await fetch("/api/admin/markup");
      if (response.ok) {
        const data = await response.json();
        setMarkup(data.markupPercentage);
        setMarkupInput(data.markupPercentage.toString());
      }
    } catch (error) {
      console.error("Error fetching markup:", error);
    }
  };

  const fetchPhoneMarkup = async () => {
    try {
      const response = await fetch("/api/admin/numbers/markup");
      if (response.ok) {
        const data = await response.json();
        setPhoneMarkup(data.markupPercentage);
        setPhoneMarkupInput(data.markupPercentage.toString());
      }
    } catch (error) {
      console.error("Error fetching phone numbers markup:", error);
    }
  };

  const fetchApiBalance = async () => {
    try {
      setBalanceLoading(true);
      const response = await fetch("/api/admin/balance");
      if (response.ok) {
        const data = await response.json();
        setApiBalance(data.balance || "0.00");
      } else {
        setApiBalance("0.00");
      }
    } catch (error) {
      console.error("Error fetching API balance:", error);
      setApiBalance("0.00");
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchAdminServices = async (search = "", page = 1) => {
    try {
      setServicesLoading(true);
      const params = new URLSearchParams({
        limit: "50",
        page: String(page),
      });
      if (search.trim()) params.set("search", search.trim());

      const response = await fetch(`/api/admin/services?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch services");
      }

      setServices(data.services || []);
      setServicesTotal(data.pagination?.total || 0);
      setServicesTotalPages(data.pagination?.totalPages || 1);
      setMarkedServiceIds([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch services",
        variant: "destructive",
      });
    } finally {
      setServicesLoading(false);
    }
  };

  const handleUpdateMarkup = async () => {
    const newMarkup = parseFloat(markupInput);
    if (isNaN(newMarkup) || newMarkup < 0) {
      toast({
        title: "Invalid markup",
        description: "Please enter a valid percentage",
        variant: "destructive",
      });
      return;
    }

    setUpdatingMarkup(true);
    try {
      const response = await fetch("/api/admin/markup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markupPercentage: newMarkup }),
      });

      if (response.ok) {
        setMarkup(newMarkup);
        toast({
          title: "Markup updated",
          description: `Markup set to ${newMarkup}%. Services will be updated on next sync.`,
        });
        fetchStats(); // Refresh stats
      } else {
        throw new Error("Failed to update markup");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update markup",
        variant: "destructive",
      });
    } finally {
      setUpdatingMarkup(false);
    }
  };

  const fetchApiCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch("/api/admin/services/sync");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load categories");
      setApiCategories(data.categories || []);
      setApiTotal(data.total ?? null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load categories from API",
        variant: "destructive",
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchSelectableApiServices = async (search = "", category = "", page = 1) => {
    setApiServicesLoading(true);
    try {
      const params = new URLSearchParams({
        list: "1",
        limit: "20",
        page: String(page),
      });
      if (search.trim()) params.set("search", search.trim());
      if (category.trim()) params.set("category", category.trim());

      const response = await fetch(`/api/admin/services/sync?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load API services");
      }

      setApiServiceOptions(data.services || []);
      setApiServicesTotal(data.pagination?.total || 0);
      setApiServicesTotalPages(data.pagination?.totalPages || 1);
      setApiCategories(data.categories || []);
      setApiTotal(data.apiTotal ?? data.total ?? null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load API services",
        variant: "destructive",
      });
    } finally {
      setApiServicesLoading(false);
    }
  };

  const toggleSelectedApiService = (serviceId: number) => {
    setSelectedApiServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const toggleSelectAllApiServicesOnPage = () => {
    if (apiServiceOptions.length === 0) return;
    const idsOnPage = apiServiceOptions.map((s) => s.service_id);
    const allSelected = idsOnPage.every((id) => selectedApiServiceIds.includes(id));
    if (allSelected) {
      setSelectedApiServiceIds((prev) => prev.filter((id) => !idsOnPage.includes(id)));
    } else {
      setSelectedApiServiceIds((prev) => Array.from(new Set([...prev, ...idsOnPage])));
    }
  };

  const handleAddSelectedServices = async () => {
    if (selectedApiServiceIds.length === 0) {
      toast({
        title: "No services selected",
        description: "Select one or more API services first.",
        variant: "destructive",
      });
      return;
    }

    setAddingSelectedServices(true);
    try {
      const response = await fetch("/api/admin/services/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceIds: selectedApiServiceIds }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to add selected services");
      }

      toast({
        title: "Services added",
        description: `${data.count || selectedApiServiceIds.length} selected service(s) added to site listings.`,
      });

      setSelectedApiServiceIds([]);
      fetchAdminServices(servicesQuery, servicesPage);
      fetchSelectableApiServices(apiServicesSearch, apiServicesCategory, apiServicesPage);
    } catch (error: any) {
      toast({
        title: "Add failed",
        description: error.message || "Failed to add selected services",
        variant: "destructive",
      });
    } finally {
      setAddingSelectedServices(false);
    }
  };

  const handleSyncServices = async () => {
    setSyncingServices(true);
    try {
      const body: Record<string, unknown> = {};
      if (syncSelectedCategories.length > 0) body.categories = syncSelectedCategories;

      const response = await fetch("/api/admin/services/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: syncSelectedCategories.length > 0 ? "Categories synced" : "All services synced",
          description:
            syncSelectedCategories.length > 0
              ? `Synced ${data.count || 0} services from ${syncSelectedCategories.length} selected categor${syncSelectedCategories.length === 1 ? "y" : "ies"}.`
              : `Successfully synced ${data.count || 0} services from SMMFollows API.`,
        });
        fetchAdminServices(servicesQuery, servicesPage);
        fetchSelectableApiServices(apiServicesSearch, apiServicesCategory, apiServicesPage);
      } else {
        throw new Error(data.error || data.details || "Failed to sync services");
      }
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync services. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncingServices(false);
    }
  };

  const handleDeleteService = async (service: AdminService) => {
    const confirmed = window.confirm(
      `Delete service "${service.name}" (ID: ${service.service_id}) from dashboard listings?`
    );
    if (!confirmed) return;

    setDeletingServiceId(service.id);
    try {
      const response = await fetch(`/api/admin/services?id=${encodeURIComponent(service.id)}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to delete service");
      }

      setServices((prev) => prev.filter((item) => item.id !== service.id));
      setMarkedServiceIds((prev) => prev.filter((id) => id !== service.id));
      toast({
        title: "Service deleted",
        description: `"${service.name}" was removed successfully.`,
      });
      fetchAdminServices(servicesQuery, servicesPage);
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Could not delete service",
        variant: "destructive",
      });
    } finally {
      setDeletingServiceId(null);
    }
  };

  const toggleMarked = (serviceId: string | number) => {
    setMarkedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const toggleMarkAll = () => {
    if (services.length === 0) return;
    const allIds = services.map((s) => s.id);
    const allMarked = allIds.every((id) => markedServiceIds.includes(id));
    setMarkedServiceIds(allMarked ? [] : allIds);
  };

  const handleDeleteMarked = async () => {
    if (markedServiceIds.length === 0) {
      toast({
        title: "No services selected",
        description: "Mark one or more services first.",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      `Delete ${markedServiceIds.length} selected service(s)? This cannot be undone.`
    );
    if (!confirmed) return;

    setUpdatingHidden(true);
    let deletedCount = 0;
    let failedCount = 0;

    for (const id of markedServiceIds) {
      try {
        const response = await fetch(`/api/admin/services?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (response.ok) {
          deletedCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    setMarkedServiceIds([]);
    await fetchAdminServices(servicesQuery, servicesPage);

    toast({
      title: failedCount === 0 ? "Services deleted" : "Partial delete",
      description:
        failedCount === 0
          ? `${deletedCount} service(s) deleted successfully.`
          : `${deletedCount} deleted, ${failedCount} failed.`,
      variant: failedCount === 0 ? "default" : "destructive",
    });
    setUpdatingHidden(false);
  };

  const handleSetMarkedHidden = async (hidden: boolean) => {
    if (markedServiceIds.length === 0) {
      toast({
        title: "No services selected",
        description: "Mark one or more services first.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingHidden(true);
    try {
      const response = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: markedServiceIds, hidden }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to update visibility");
      }

      setServices((prev) =>
        prev.map((service) =>
          markedServiceIds.includes(service.id)
            ? { ...service, is_hidden: hidden }
            : service
        )
      );
      setMarkedServiceIds([]);
      toast({
        title: hidden ? "Services hidden" : "Services unhidden",
        description: `${data.updated?.length || markedServiceIds.length} service(s) updated.`,
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update service visibility",
        variant: "destructive",
      });
    } finally {
      setUpdatingHidden(false);
    }
  };

  const handleUpdatePhoneMarkup = async () => {
    const newMarkup = parseFloat(phoneMarkupInput);
    if (isNaN(newMarkup) || newMarkup < 0) {
      toast({
        title: "Invalid markup",
        description: "Please enter a valid percentage",
        variant: "destructive",
      });
      return;
    }

    setUpdatingPhoneMarkup(true);
    try {
      const response = await fetch("/api/admin/numbers/markup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markupPercentage: newMarkup }),
      });

      if (response.ok) {
        setPhoneMarkup(newMarkup);
        toast({
          title: "Phone Numbers Markup updated",
          description: `Markup set to ${newMarkup}%. New number prices will reflect this markup.`,
        });
      } else {
        throw new Error("Failed to update markup");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update phone numbers markup",
        variant: "destructive",
      });
    } finally {
      setUpdatingPhoneMarkup(false);
    }
  };

  const revenueChange =
    stats && stats.lastMonthRevenue > 0
      ? ((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100
      : 0;
  const profitChange =
    stats && stats.lastMonthProfit > 0
      ? ((stats.thisMonthProfit - stats.lastMonthProfit) / stats.lastMonthProfit) * 100
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7C5CFC]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      <div className="px-4 pt-4 pb-10 md:px-6 md:pt-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Monitor profits and manage settings</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users">
            <Button variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </Button>
          </Link>
          <Link href="/admin/numbers">
            <Button variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <Phone className="h-4 w-4 mr-2" />
              Numbers Analytics
            </Button>
          </Link>
        </div>
      </div>

      <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
        <button
          type="button"
          onClick={() => setAdminTab("overview")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            adminTab === "overview"
              ? "bg-[#7C5CFC] text-white"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setAdminTab("services")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            adminTab === "services"
              ? "bg-[#7C5CFC] text-white"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          Services
        </button>
      </div>

      {adminTab === "overview" && (
      <>
      {/* API Balance Card */}
      <Card className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900 shadow-sm">
        <CardHeader>
          <div>
            <CardTitle className="text-blue-900 dark:text-blue-100">API Account Balance</CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-200">
              Your therealowlet.com account balance in Naira
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">Loading...</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(convert(parseFloat(apiBalance || "0")))}
                  </p>
                </div>
                <Button onClick={fetchApiBalance} variant="outline" size="sm" className="bg-white/80 dark:bg-gray-900 border-blue-200/60">
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </>
      )}

      {adminTab === "services" && (
      <>
      {/* Select & Add Services */}
      <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-100">Select Services To Add</CardTitle>
          <CardDescription>
            Pick specific services from SMMFollows and add them to your site listings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <Input
              value={apiServicesSearch}
              onChange={(e) => setApiServicesSearch(e.target.value)}
              placeholder="Search API services by name, ID, category, type"
              className="md:w-80 rounded-xl"
            />
            <select
              value={apiServicesCategory}
              onChange={(e) => setApiServicesCategory(e.target.value)}
              className="h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-700 dark:text-gray-200"
            >
              <option value="">All categories</option>
              {apiCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchSelectableApiServices(apiServicesSearch, apiServicesCategory, apiServicesPage)}
              disabled={apiServicesLoading}
              className="rounded-xl"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${apiServicesLoading ? "animate-spin" : ""}`} />
              Reload
            </Button>
            <Button
              type="button"
              onClick={handleAddSelectedServices}
              disabled={addingSelectedServices || selectedApiServiceIds.length === 0}
              className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl"
            >
              {addingSelectedServices ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add Selected (${selectedApiServiceIds.length})`
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            API services found: {apiServicesTotal} | Selected: {selectedApiServiceIds.length}
          </p>

          {apiServicesLoading ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading API services...</div>
          ) : apiServiceOptions.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">No API services found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 pr-3 font-medium text-gray-500 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={apiServiceOptions.length > 0 && apiServiceOptions.every((s) => selectedApiServiceIds.includes(s.service_id))}
                        onChange={toggleSelectAllApiServicesOnPage}
                      />
                    </th>
                    <th className="text-left py-2 pr-3 font-medium text-gray-500 dark:text-gray-400">Service ID</th>
                    <th className="text-left py-2 pr-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="text-left py-2 pr-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
                    <th className="text-left py-2 pr-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="text-left py-2 pr-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apiServiceOptions.map((service) => (
                    <tr key={service.service_id} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-3 pr-3">
                        <input
                          type="checkbox"
                          checked={selectedApiServiceIds.includes(service.service_id)}
                          onChange={() => toggleSelectedApiService(service.service_id)}
                        />
                      </td>
                      <td className="py-3 pr-3 text-gray-700 dark:text-gray-200">{service.service_id}</td>
                      <td className="py-3 pr-3 text-gray-800 dark:text-gray-100">{service.name}</td>
                      <td className="py-3 pr-3 text-gray-700 dark:text-gray-200">{service.category || "-"}</td>
                      <td className="py-3 pr-3 text-gray-700 dark:text-gray-200">{service.type || "-"}</td>
                      <td className="py-3 pr-3">
                        {service.exists_in_db ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              service.is_hidden
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            }`}
                          >
                            {service.is_hidden ? "Already added (hidden)" : "Already added (visible)"}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            Not added
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {apiServicesPage} of {apiServicesTotalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={apiServicesLoading || apiServicesPage <= 1}
                onClick={() => setApiServicesPage((p) => Math.max(1, p - 1))}
                className="rounded-xl"
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={apiServicesLoading || apiServicesPage >= apiServicesTotalPages}
                onClick={() => setApiServicesPage((p) => Math.min(apiServicesTotalPages, p + 1))}
                className="rounded-xl"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Sync */}
      <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-100">Services Management</CardTitle>
          <CardDescription>Sync services from SMMFollows API to database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Mark categories (optional), then click Sync Services. If no category is marked, all services will be synced.
          </p>

          {/* Category multi-select */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Categories
                {apiTotal !== null && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({apiTotal} total services in API)
                  </span>
                )}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchApiCategories}
                disabled={loadingCategories}
                className="rounded-xl"
              >
                {loadingCategories ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                {loadingCategories ? "Loading..." : apiCategories.length > 0 ? "Reload" : "Load Categories"}
              </Button>
            </div>

            {apiCategories.length === 0 ? (
              <p className="text-xs text-gray-400">Click "Load Categories" to fetch available categories from the API.</p>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                {/* Search + select-all header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <input
                    type="text"
                    value={syncCategorySearch}
                    onChange={(e) => setSyncCategorySearch(e.target.value)}
                    placeholder="Search categories..."
                    className="flex-1 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    className="text-xs text-[#7C5CFC] hover:underline shrink-0"
                    onClick={() => {
                      const visible = apiCategories.filter((c) =>
                        c.toLowerCase().includes(syncCategorySearch.toLowerCase())
                      );
                      const allSelected = visible.every((c) => syncSelectedCategories.includes(c));
                      if (allSelected) {
                        setSyncSelectedCategories((prev) => prev.filter((c) => !visible.includes(c)));
                      } else {
                        setSyncSelectedCategories((prev) => Array.from(new Set([...prev, ...visible])));
                      }
                    }}
                  >
                    {(() => {
                      const visible = apiCategories.filter((c) =>
                        c.toLowerCase().includes(syncCategorySearch.toLowerCase())
                      );
                      return visible.every((c) => syncSelectedCategories.includes(c))
                        ? "Deselect all"
                        : "Select all";
                    })()}
                  </button>
                  {syncSelectedCategories.length > 0 && (
                    <button
                      type="button"
                      className="text-xs text-gray-400 hover:text-red-500 shrink-0"
                      onClick={() => setSyncSelectedCategories([])}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Scrollable list */}
                <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
                  {apiCategories
                    .filter((c) => c.toLowerCase().includes(syncCategorySearch.toLowerCase()))
                    .map((cat) => (
                      <label
                        key={cat}
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 text-sm text-gray-800 dark:text-gray-100"
                      >
                        <input
                          type="checkbox"
                          checked={syncSelectedCategories.includes(cat)}
                          onChange={() =>
                            setSyncSelectedCategories((prev) =>
                              prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                            )
                          }
                          className="accent-[#7C5CFC]"
                        />
                        <span className="truncate">{cat}</span>
                      </label>
                    ))}
                </div>

                <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
                  {syncSelectedCategories.length === 0
                    ? "No categories selected — all will be synced"
                    : `${syncSelectedCategories.length} categor${syncSelectedCategories.length === 1 ? "y" : "ies"} selected`}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={handleSyncServices}
              disabled={syncingServices}
              className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl"
            >
              {syncingServices ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Syncing...</>
              ) : (
                "Sync Services"
              )}
            </Button>
            {syncSelectedCategories.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setSyncSelectedCategories([])}
                disabled={syncingServices}
                className="rounded-xl"
              >
                Clear Marks
              </Button>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {syncSelectedCategories.length > 0
                ? `${syncSelectedCategories.length} categor${syncSelectedCategories.length === 1 ? "y" : "ies"}`
                : "All categories"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-gray-800 dark:text-gray-100">Manage Services</CardTitle>
              <CardDescription>
                Mark services, hide/unhide them, or delete them. Showing up to 50 at a time.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={servicesQuery}
                onChange={(e) => setServicesQuery(e.target.value)}
                placeholder="Search name, category, type, ID"
                className="w-64 rounded-xl"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSetMarkedHidden(true)}
                disabled={updatingHidden || markedServiceIds.length === 0}
                className="rounded-xl"
              >
                {updatingHidden ? "Updating..." : "Hide Marked"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSetMarkedHidden(false)}
                disabled={updatingHidden || markedServiceIds.length === 0}
                className="rounded-xl"
              >
                {updatingHidden ? "Updating..." : "Unhide Marked"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDeleteMarked}
                disabled={updatingHidden || markedServiceIds.length === 0}
                className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fetchAdminServices(servicesQuery, servicesPage)}
                disabled={servicesLoading}
                className="rounded-xl"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${servicesLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Total services: {servicesTotal} | Marked: {markedServiceIds.length}
          </p>
          {servicesLoading ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No services found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 pr-3 font-medium text-gray-500 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={services.length > 0 && services.every((s) => markedServiceIds.includes(s.id))}
                        onChange={toggleMarkAll}
                      />
                    </th>
                    <th className="text-left py-2 pr-3 font-medium text-gray-500 dark:text-gray-400">Service ID</th>
                    <th className="text-left py-2 pr-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="text-left py-2 pr-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
                    <th className="text-left py-2 pr-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="text-left py-2 pr-3 font-medium text-gray-500 dark:text-gray-400">Visibility</th>
                    <th className="text-left py-2 pr-3 font-medium text-gray-500 dark:text-gray-400">Min-Max</th>
                    <th className="text-right py-2 font-medium text-gray-500 dark:text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-3 pr-3">
                        <input
                          type="checkbox"
                          checked={markedServiceIds.includes(service.id)}
                          onChange={() => toggleMarked(service.id)}
                        />
                      </td>
                      <td className="py-3 pr-3 text-gray-700 dark:text-gray-200">{service.service_id}</td>
                      <td className="py-3 pr-3 text-gray-800 dark:text-gray-100">{service.name}</td>
                      <td className="py-3 pr-3 text-gray-700 dark:text-gray-200">{service.category || "-"}</td>
                      <td className="py-3 pr-3 text-gray-700 dark:text-gray-200">{service.type || "-"}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            service.is_hidden
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          }`}
                        >
                          {service.is_hidden ? "Hidden" : "Visible"}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-gray-700 dark:text-gray-200">
                        {service.min_quantity} - {service.max_quantity}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleDeleteService(service)}
                          disabled={deletingServiceId === service.id}
                          className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deletingServiceId === service.id ? "Deleting..." : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {servicesPage} of {servicesTotalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={servicesLoading || servicesPage <= 1}
                onClick={() => setServicesPage((p) => Math.max(1, p - 1))}
                className="rounded-xl"
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={servicesLoading || servicesPage >= servicesTotalPages}
                onClick={() => setServicesPage((p) => Math.min(servicesTotalPages, p + 1))}
                className="rounded-xl"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </>
      )}

      {adminTab === "overview" && (
      <>
      {/* Services Markup Control */}
      <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-100">Services Profit Markup Settings</CardTitle>
          <CardDescription>Control the profit margin percentage for all social media services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="markup">Markup Percentage</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="markup"
                  type="number"
                  min="0"
                  step="0.1"
                  value={markupInput}
                  onChange={(e) => setMarkupInput(e.target.value)}
                  className="w-32 rounded-xl"
                />
                <span className="text-gray-600">%</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current markup: {markup}% | Example: {formatCurrency(convert(1))} API cost = {formatCurrency(convert(1 * (1 + markup / 100)))} customer price
              </p>
            </div>
            <Button onClick={handleUpdateMarkup} disabled={updatingMarkup} className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl">
              {updatingMarkup ? "Updating..." : "Update Markup"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Phone Numbers Markup Control */}
      <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-100">Phone Numbers Profit Markup Settings</CardTitle>
          <CardDescription>Control the profit margin percentage for virtual phone numbers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="phoneMarkup">Markup Percentage</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="phoneMarkup"
                  type="number"
                  min="0"
                  step="0.1"
                  value={phoneMarkupInput}
                  onChange={(e) => setPhoneMarkupInput(e.target.value)}
                  className="w-32 rounded-xl"
                />
                <span className="text-gray-600">%</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current markup: {phoneMarkup}% | Example: {formatCurrency(convert(1))} base cost = {formatCurrency(convert(1 * (1 + phoneMarkup / 100)))} customer price
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Default: 400% (5x cost). This markup applies to monthly number rental fees.
              </p>
            </div>
            <Button onClick={handleUpdatePhoneMarkup} disabled={updatingPhoneMarkup} className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl">
              {updatingPhoneMarkup ? "Updating..." : "Update Markup"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(convert(stats?.totalRevenue || 0))}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(convert(stats?.totalCosts || 0))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">API costs</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(convert(stats?.totalProfit || 0))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Net profit</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-gray-100">This Month</CardTitle>
            <CardDescription>
              {revenueChange !== 0 && (
                <span className={revenueChange >= 0 ? "text-green-600" : "text-red-600"}>
                  {revenueChange >= 0 ? "+" : ""}
                  {revenueChange.toFixed(1)}% from last month
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(convert(stats?.thisMonthRevenue || 0))}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(convert(stats?.thisMonthProfit || 0))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Profit</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-gray-100">Last Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(convert(stats?.lastMonthRevenue || 0))}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(convert(stats?.lastMonthProfit || 0))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Profit</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader className="border-b border-gray-100 dark:border-gray-700">
          <CardTitle className="text-gray-800 dark:text-gray-100">Recent Orders</CardTitle>
          <CardDescription>Latest orders with profit data</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {stats.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {order.services?.name || "Service"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.users?.email || order.users?.full_name || "User"}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {order.quantity.toLocaleString()} items
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Revenue</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {formatCurrency(convert(parseFloat(order.customer_charge || order.charge || "0")))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Profit</p>
                        <p className="font-medium text-green-600">
                          {formatCurrency(convert(parseFloat(order.profit || "0")))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Date</p>
                        <p className="font-medium text-xs text-gray-600 dark:text-gray-300">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No orders yet</p>
          )}
        </CardContent>
      </Card>
      </>
      )}
      </div>
    </div>
  );
}
