"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { ToolDefinition } from "@/tools/_types";
import type { z } from "zod";
import { US_STATES } from "@/data/states";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tool: ToolDefinition<z.ZodTypeAny, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onResult: (result: { id: string; inputs: any; outputs: any }) => void;
}

export default function ToolForm({ tool, onResult }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(tool.inputs),
    defaultValues: tool.inputFields.reduce<Record<string, unknown>>((acc, field) => {
      if (field.defaultValue !== undefined) acc[field.name] = field.defaultValue;
      return acc;
    }, {}),
  });

  async function onSubmit(data: z.infer<typeof tool.inputs>) {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/tools/${tool.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Something went wrong. Try again.");
      }

      const { id, outputs } = await res.json();
      onResult({ id, inputs: data, outputs });

      // Scroll to results
      setTimeout(() => {
        document.querySelector("[aria-live]")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {tool.inputFields.map((field) => {
        const fieldError = form.formState.errors[field.name];
        const errorMessage = fieldError?.message as string | undefined;

        return (
          <div key={field.name} className="space-y-2">
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-ink"
            >
              {field.label}
              {field.required !== false && (
                <span className="text-danger ml-1" aria-hidden="true">*</span>
              )}
            </label>

            {field.helpText && (
              <p
                id={`${field.name}-help`}
                className="text-sm text-ink-muted"
              >
                {field.helpText}
              </p>
            )}

            {(field.type === "currency" || field.type === "number" || field.type === "percent") && (
              <div className="relative">
                {field.type === "currency" && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">$</span>
                )}
                <input
                  id={field.name}
                  type="number"
                  min={0}
                  placeholder={field.placeholder}
                  aria-describedby={field.helpText ? `${field.name}-help` : undefined}
                  className={`w-full min-h-tap text-base rounded-lg border px-3 py-3 ${
                    field.type === "currency" ? "pl-7" : ""
                  } border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring ${
                    errorMessage ? "border-danger" : ""
                  }`}
                  {...form.register(field.name, { valueAsNumber: true })}
                />
              </div>
            )}

            {field.type === "state" && (
              <select
                id={field.name}
                aria-describedby={field.helpText ? `${field.name}-help` : undefined}
                className={`w-full min-h-tap text-base rounded-lg border px-3 py-3 border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring ${
                  errorMessage ? "border-danger" : ""
                }`}
                {...form.register(field.name)}
              >
                <option value="">Select your state</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            {field.type === "select" && field.options && (
              <select
                id={field.name}
                aria-describedby={field.helpText ? `${field.name}-help` : undefined}
                className={`w-full min-h-tap text-base rounded-lg border px-3 py-3 border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring ${
                  errorMessage ? "border-danger" : ""
                }`}
                {...form.register(field.name)}
              >
                <option value="">Select an option</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === "radio" && field.options && (
              <div
                role="radiogroup"
                aria-labelledby={`${field.name}-label`}
                className="space-y-2"
              >
                {field.options.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-paper-soft min-h-tap"
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      className="w-4 h-4 text-brand"
                      aria-describedby={field.helpText ? `${field.name}-help` : undefined}
                      {...form.register(field.name)}
                    />
                    <span className="text-base text-ink">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            {field.type === "textarea" && (
              <textarea
                id={field.name}
                placeholder={field.placeholder}
                rows={4}
                aria-describedby={field.helpText ? `${field.name}-help` : undefined}
                className={`w-full text-base rounded-lg border px-3 py-3 border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none ${
                  errorMessage ? "border-danger" : ""
                }`}
                {...form.register(field.name)}
              />
            )}

            {errorMessage && (
              <p className="text-sm text-danger" role="alert">
                {errorMessage}
              </p>
            )}
          </div>
        );
      })}

      {error && (
        <div
          className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-tap bg-brand text-white font-semibold rounded-lg px-6 py-3 text-base hover:bg-brand-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Calculating..." : "Calculate"}
      </button>
    </form>
  );
}
