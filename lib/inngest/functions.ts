import { inngest } from "@/lib/inngest/client";
import { runRefunds } from "@/lib/cron/refunds";

export const refundsCron = inngest.createFunction(
  { id: "textverified-refunds-cron", name: "Textverified Refunds Cron" },
  { cron: "15 * * * *" },
  async () => {
    return await runRefunds();
  }
);
