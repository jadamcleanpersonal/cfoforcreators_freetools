import TaxEstimatorClient from "@/components/tool/TaxEstimatorClient";
import taxEstimator from "@/tools/tax-estimator";
// Server Component — exports metadata, renders client wrapper.
// The tool object (Zod schema + functions) stays client-side to avoid serialization issues.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: taxEstimator.metaTitle,
  description: taxEstimator.metaDescription,
};

export default function TaxEstimatorPage() {
  return <TaxEstimatorClient />;
}
