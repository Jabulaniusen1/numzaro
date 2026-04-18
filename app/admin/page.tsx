"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";

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
    const timer = setTimeout(() => {
      fetchSelectableApiServices(apiServicesSearch, apiServicesCategory, apiServicesPage);
    }, 300);
    return () => clearTimeout(timer);
  }, [apiServicesSearch, apiServicesCategory, apiServicesPage]);

  useEffect(() => {
    if (apiCategories.length > 0 || loadingCategories) return;
    fetchApiCategories();
  }, [apiCategories.length, loadingCategories]);

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
              : `Successfully synced ${data.count || 0} services from JAP API.`,
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

  return (
    <div className="space-y-6">
      {/* Select & Add Services */}
      <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-100">Select Services To Add</CardTitle>
          <CardDescription>
            Pick specific services from JAP and add them to your site listings.
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
              <table className="w-full text-sm min-w-[640px]">
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
          <CardDescription>Sync services from JAP API to database</CardDescription>
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
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle className="text-gray-800 dark:text-gray-100">Manage Services</CardTitle>
              <CardDescription>
                Mark services, hide/unhide them, or delete them. Showing up to 50 at a time.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
              <table className="w-full text-sm min-w-[760px]">
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
    </div>
  );
}
