import ContractScannerClient from "@/components/contract/ContractScannerClient";
import contractScanner from "@/tools/contract-scanner";
// Server Component — exports metadata, renders client wrapper.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: contractScanner.metaTitle,
  description: contractScanner.metaDescription,
};

export default function ContractScannerPage() {
  return <ContractScannerClient />;
}
