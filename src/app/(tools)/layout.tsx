import StickyEmailBar from "@/components/waitlist/StickyEmailBar";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <StickyEmailBar source="tool-sticky" />
    </>
  );
}
