import { grizzlyClient } from "@/lib/grizzly/client";

export async function syncGrizzlyActivation(
  numberId: string,
  activationId: string,
  supabase: any
) {
  try {
    const status = await grizzlyClient.getStatus(activationId);

    if (status.startsWith("STATUS_OK:")) {
      const code = status.split(":")[1] || "";
      const content = `SMS code: ${code}`;

      const { data: existing } = await supabase
        .from("messages")
        .select("id")
        .eq("number_id", numberId)
        .eq("body", content)
        .maybeSingle();

      if (!existing) {
        await supabase.from("messages").insert({
          number_id: numberId,
          direction: "inbound",
          body: content,
          is_otp: true,
          otp_code: code,
          created_at: new Date().toISOString(),
        });

        const { data: existingOtp } = await supabase
          .from("otp_codes")
          .select("id")
          .eq("number_id", numberId)
          .eq("code", code)
          .maybeSingle();

        if (!existingOtp) {
          await supabase.from("otp_codes").insert({
            number_id: numberId,
            code,
            status: "pending",
            created_at: new Date().toISOString(),
          });
        }

        await supabase
          .from("virtual_numbers")
          .update({ status: "active" })
          .eq("id", numberId);
      }
      return;
    }

    if (status === "STATUS_CANCEL") {
      await supabase
        .from("virtual_numbers")
        .update({ status: "cancelled" })
        .eq("id", numberId);
      return;
    }

    if (status.startsWith("STATUS_WAIT_RETRY:")) {
      const lastCode = status.split(":")[1] || "";
      const content = `SMS retry requested. Last code: ${lastCode}`;
      const { data: existing } = await supabase
        .from("messages")
        .select("id")
        .eq("number_id", numberId)
        .eq("body", content)
        .maybeSingle();
      if (!existing) {
        await supabase.from("messages").insert({
          number_id: numberId,
          direction: "inbound",
          body: content,
          is_otp: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error("[grizzly] Activation sync error:", error);
  }
}
