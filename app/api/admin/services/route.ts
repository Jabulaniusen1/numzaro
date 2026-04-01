import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";

function isAdmin(email?: string | null) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
  return adminEmails.includes(email || "");
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const search = (searchParams.get("search") || "").trim();

    let query = supabase
      .from("services")
      .select(
        "id, service_id, name, category, type, cost_rate, rate, min_quantity, max_quantity, is_hidden, created_at",
        { count: "exact" }
      )
      .order("name", { ascending: true });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,category.ilike.%${search}%,type.ilike.%${search}%,service_id.ilike.%${search}%`
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("Error fetching admin services:", error);
      return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
    }

    return NextResponse.json({
      services: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.max(1, Math.ceil(count / limit)) : 1,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/services:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get("id");

    if (!serviceId) {
      return NextResponse.json({ error: "Missing required query parameter: id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId)
      .select("id, name")
      .maybeSingle();

    if (error) {
      console.error("Error deleting service:", error);
      return NextResponse.json(
        { error: "Failed to delete service", details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully",
      service: data,
    });
  } catch (error) {
    console.error("Error in DELETE /api/admin/services:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (typeof body?.hidden !== "boolean") {
      return NextResponse.json({ error: "hidden must be a boolean" }, { status: 400 });
    }
    const hidden = body.hidden as boolean;

    if (ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("services")
      .update({ is_hidden: hidden, updated_at: new Date().toISOString() })
      .in("id", ids)
      .select("id, service_id, name, is_hidden");

    if (error) {
      console.error("Error updating hidden services:", error);
      return NextResponse.json(
        { error: "Failed to update services visibility", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: data || [],
      hidden,
    });
  } catch (error) {
    console.error("Error in PATCH /api/admin/services:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
