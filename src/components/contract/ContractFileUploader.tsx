"use client";

// Drag-and-drop + file picker for contract upload.
// Accepts .pdf and .docx, max 10MB.
// Reports upload state: idle → uploading → success | error.

import { useRef, useState } from "react";

export type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "success"; filename: string }
  | { status: "error"; message: string };

interface Props {
  onExtracted: (text: string, filename: string) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export default function ContractFileUploader({ onExtracted, disabled }: Props) {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    // Client-side size check before upload
    if (file.size > MAX_SIZE_BYTES) {
      setState({ status: "error", message: "file too large. max 10MB." });
      return;
    }

    // Client-side type check
    const isValidType =
      ACCEPTED_TYPES.includes(file.type) ||
      ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
      setState({ status: "error", message: "we only accept .pdf and .docx files." });
      return;
    }

    setState({ status: "uploading" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/tools/contract-scanner/extract", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setState({ status: "error", message: json.message ?? "couldn't read this file." });
        return;
      }

      const text: string = json.text;
      setState({ status: "success", filename: file.name });
      onExtracted(text, file.name);
    } catch {
      setState({
        status: "error",
        message: "upload failed. check your connection and try again.",
      });
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  const isUploading = state.status === "uploading";
  const isSuccess = state.status === "success";

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer
          ${isDragging ? "border-brand bg-brand/5" : "border-border hover:border-brand/50 hover:bg-paper-soft"}
          ${isSuccess ? "border-brand/40 bg-brand/5" : ""}
          ${disabled || isUploading ? "pointer-events-none opacity-60" : ""}
        `}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="upload contract file"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleInputChange}
          className="sr-only"
          aria-hidden="true"
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="space-y-2">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-ink-muted">reading file...</p>
          </div>
        ) : isSuccess && state.status === "success" ? (
          <div className="space-y-2">
            <div className="text-2xl" aria-hidden="true">
              ✓
            </div>
            <p className="text-sm font-medium text-brand">{state.filename}</p>
            <p className="text-xs text-ink-muted">
              file extracted.{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setState({ status: "idle" });
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="underline hover:text-ink"
              >
                replace
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-3xl text-ink-muted" aria-hidden="true">
              ↑
            </div>
            <p className="text-sm font-medium text-ink">
              drag a file here, or{" "}
              <span className="text-brand underline">click to browse</span>
            </p>
            <p className="text-xs text-ink-muted">.pdf or .docx · max 10MB</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {state.status === "error" && (
        <p className="text-sm text-danger" role="alert">
          {state.message}
        </p>
      )}
    </div>
  );
}
