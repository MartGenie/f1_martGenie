"use client";

import { useEffect, useState } from "react";

type ProductShareModalProps = {
  open: boolean;
  title: string;
  shareLabel?: string;
  onClose: () => void;
  onSubmit: (recipientEmail: string) => Promise<void>;
};

export default function ProductShareModal({
  open,
  title,
  shareLabel = "pick",
  onClose,
  onSubmit,
}: ProductShareModalProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setRecipientEmail("");
      setError("");
      setSuccessMessage("");
      setIsSubmitting(false);
    }
  }, [open]);

  async function handleSubmit() {
    if (!recipientEmail.trim()) {
      setError(`Enter an email address to share this ${shareLabel}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");
      await onSubmit(recipientEmail.trim());
      setSuccessMessage("Shared successfully. The email is on its way.");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : `Could not share this ${shareLabel}.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="w-full max-w-[520px] rounded-[32px] border border-white/50 bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fb_100%)] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c8da5]">
              Share by email
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#101828]">
              Send this {shareLabel} by email
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#667085]">{title}</p>
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dce5ef] bg-white text-xl text-[#344054] transition hover:bg-[#f8fafc]"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="mt-6">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#7c8da5]">
              Recipient email
            </span>
            <input
              className="h-12 w-full rounded-[18px] border border-[#dce5ef] bg-white px-4 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#93c5fd] focus:ring-4 focus:ring-[#dbeafe]"
              onChange={(event) => setRecipientEmail(event.target.value)}
              placeholder="friend@example.com"
              type="email"
              value={recipientEmail}
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-[#b42318]">{error}</p> : null}
        {successMessage ? (
          <p className="mt-4 text-sm font-medium text-emerald-600">{successMessage}</p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            className="inline-flex h-11 items-center justify-center rounded-[16px] border border-[#dce5ef] bg-white px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex h-11 items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,#111827_0%,#1f2937_100%)] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.14)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
            type="button"
          >
            {isSubmitting ? "Sending..." : "Send email"}
          </button>
        </div>
      </div>
    </div>
  );
}
