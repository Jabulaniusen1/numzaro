"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OrderForm } from "./OrderForm";
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

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const [open, setOpen] = useState(false);
  const { format, loading: currencyLoading } = useCurrency();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{service.name}</CardTitle>
            <CardDescription>{service.type}</CardDescription>
          </div>
          <Badge variant="outline">{service.category}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-2xl font-bold text-[#1877F2]">
              {currencyLoading ? (
                "Loading..."
              ) : (
                format(Number(service.rate ?? 0))
              )}
            </p>
            <p className="text-sm text-gray-600">per 1000</p>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p>
              Min: {(service.min_quantity ?? 0).toLocaleString()} • Max:{" "}
              {(service.max_quantity ?? 0).toLocaleString()}
            </p>
            <div className="flex gap-2 mt-2">
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
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">Order Now</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Order {service.name}</DialogTitle>
                <DialogDescription>
                  Enter your social media link and quantity
                </DialogDescription>
              </DialogHeader>
              <OrderForm
                service={service}
                onSuccess={() => setOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

