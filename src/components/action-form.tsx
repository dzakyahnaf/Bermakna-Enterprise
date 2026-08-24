"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

import type { ActionState } from "@/lib/action-state";

type Aksi = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Pembungkus formulir yang menampilkan pesan galat/berhasil dari Server Action
 * dan menonaktifkan tombol kirim selama proses berjalan.
 */
export function ActionForm({
  action,
  children,
  className = "space-y-4",
  submitLabel,
  submitClassName = "btn-primary btn-block",
  encType,
}: {
  action: Aksi;
  children: ReactNode;
  className?: string;
  submitLabel?: string;
  submitClassName?: string;
  encType?: string;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className={className} encType={encType}>
      {state?.error && (
        <p className="rounded-xl border border-merah-500/25 bg-merah-500/8 px-4 py-3 text-sm font-medium text-merah-900">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-xl border border-hijau-600/25 bg-hijau-100 px-4 py-3 text-sm font-medium text-hijau-600">
          {state.success}
        </p>
      )}
      {children}
      {submitLabel && <SubmitButton className={submitClassName}>{submitLabel}</SubmitButton>}
    </form>
  );
}

/**
 * Tombol kirim yang otomatis menampilkan status "sedang memproses".
 * Bisa dipakai di dalam <ActionForm> maupun <form> biasa.
 */
export function SubmitButton({
  children,
  className = "btn-primary",
  pendingLabel,
  confirm,
  name,
  value,
  title,
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
  confirm?: string;
  name?: string;
  value?: string;
  title?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      title={title}
      disabled={pending}
      className={className}
      onClick={
        confirm
          ? (e) => {
              if (!window.confirm(confirm)) e.preventDefault();
            }
          : undefined
      }
    >
      {pending ? (
        <>
          <Spinner />
          {pendingLabel ?? "Memproses…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
