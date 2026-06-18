import SponsorRateCalculatorClient from "@/components/tool/SponsorRateCalculatorClient";
import sponsorRate from "@/tools/sponsor-rate";
// Server Component — exports metadata, renders client wrapper.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: sponsorRate.metaTitle,
  description: sponsorRate.metaDescription,
};

export default function SponsorRatePage() {
  return <SponsorRateCalculatorClient />;
}
