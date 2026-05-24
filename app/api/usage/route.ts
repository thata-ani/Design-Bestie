import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch usage data from Supabase
  let { data: usage, error } = await supabase
    .from("usage")
    .select("used, limit, is_pro")
    .eq("user_id", user.id)
    .single();

  // If no usage record exists, create one with defaults
  if (error && error.code === "PGRST116") {
    const { data: newUsage, error: insertError } = await supabase
      .from("usage")
      .insert([
        {
          user_id: user.id,
          used: 0,
          limit: 14,
          is_pro: false,
        },
      ])
      .select("used, limit, is_pro")
      .single();

    if (insertError) {
      console.error("Failed to create usage record:", insertError);
      return NextResponse.json({ error: "Failed to create usage record" }, { status: 500 });
    }

    usage = newUsage;
  } else if (error) {
    console.error("Failed to fetch usage:", error);
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }

  return NextResponse.json({
    used: usage.used,
    limit: usage.limit,
    is_pro: usage.is_pro,
  });
}
