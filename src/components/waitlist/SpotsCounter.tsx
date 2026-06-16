import { supabaseAdmin } from "@/lib/supabase/admin";

// Server component — ISR, revalidates every 60 seconds.
// Query: 100 - count(*) from deepdive_intakes where income_tier != 'under_1k'
export const revalidate = 60;

const TOTAL_SPOTS = 100;

async function getSpotsRemaining(): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from("deepdive_intakes")
      .select("*", { count: "exact", head: true })
      .neq("income_tier", "under_1k");

    if (error) throw error;
    return Math.max(0, TOTAL_SPOTS - (count ?? 0));
  } catch (err) {
    console.error("SpotsCounter query error:", err);
    return TOTAL_SPOTS; // fall back to full count if query fails
  }
}

interface Props {
  className?: string;
}

export default async function SpotsCounter({ className = "" }: Props) {
  const remaining = await getSpotsRemaining();
  const isFull = remaining === 0;

  return (
    <p
      className={`text-sm font-semibold ${isFull ? "text-danger" : "text-warn"} ${className}`}
      aria-live="polite"
    >
      {isFull ? (
        <>all 100 spots are claimed.</>
      ) : (
        <>
          <span className="text-lg">{remaining}</span> of {TOTAL_SPOTS} spots remaining.
        </>
      )}
    </p>
  );
}
