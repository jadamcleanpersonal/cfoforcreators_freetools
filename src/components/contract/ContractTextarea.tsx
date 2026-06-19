"use client";

// Contract textarea with 50k character limit, live counter, and paste affordance.
// Used in the ContractScannerClient form.

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

const MAX_CHARS = 50_000;

export default function ContractTextarea({ value, onChange, error, disabled }: Props) {
  const charCount = value.length;
  const isNearLimit = charCount > MAX_CHARS * 0.9;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <div className="space-y-1.5">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={14}
        maxLength={MAX_CHARS + 1000} // allow slight overage so the count warning shows
        placeholder="paste your brand deal contract here (up to 50,000 characters, about 35 pages)..."
        aria-label="Contract text"
        aria-describedby="contract-char-count"
        className={`w-full text-base rounded-lg border px-3 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y min-h-[280px] ${
          error || isOverLimit ? "border-danger" : "border-border"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      />
      <div
        id="contract-char-count"
        className={`flex justify-between text-xs ${
          isOverLimit ? "text-danger" : isNearLimit ? "text-warn" : "text-ink-muted"
        }`}
      >
        <span>
          {charCount > 0
            ? isOverLimit
              ? `${(charCount - MAX_CHARS).toLocaleString()} characters over the limit. shorten or paste key sections only`
              : `${charCount.toLocaleString()} / ${MAX_CHARS.toLocaleString()} characters`
            : ""}
        </span>
        {charCount === 0 && (
          <span className="text-ink-muted">tip: Ctrl+A → Ctrl+C in the PDF, then paste here</span>
        )}
      </div>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
