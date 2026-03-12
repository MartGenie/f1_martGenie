"use client";

import AuthForm from "@/src/components/AuthForm";

type Props = {
  open: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
};

export default function AuthModal({ open, onClose, onAuthSuccess }: Props) {
  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(15,23,42,0.46)] px-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
    >
      <div className="w-full max-w-[680px]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex justify-end">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/55 bg-white/85 text-2xl text-[#2f2a26] shadow-[0_14px_32px_rgba(15,23,42,0.16)] transition hover:bg-white"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <AuthForm
          onSuccess={() => {
            onAuthSuccess?.();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
