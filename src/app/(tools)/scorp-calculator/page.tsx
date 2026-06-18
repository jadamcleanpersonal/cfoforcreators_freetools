import ScorpCalculatorClient from "@/components/tool/ScorpCalculatorClient";
import scorpCalculator from "@/tools/scorp-calculator";
// Server Component — exports metadata, renders client wrapper.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: scorpCalculator.metaTitle,
  description: scorpCalculator.metaDescription,
};

export default function ScorpCalculatorPage() {
  return <ScorpCalculatorClient />;
}
