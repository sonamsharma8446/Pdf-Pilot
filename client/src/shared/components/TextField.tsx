import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  error?: string | null;
  success?: string | null;
}

export function TextField({ id, label, error, success, className = "", ...rest }: TextFieldProps) {
  const helpId = error || success ? `${id}-help` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={helpId}
        className={`h-10 w-full rounded-lg border bg-surface px-3 text-sm text-ink outline-none
          transition-colors placeholder:text-ink-faint
          ${error ? "border-danger focus:shadow-[0_0_0_3px_rgb(206_43_30_/_0.14)]" : "border-line-strong focus:border-indigo focus:shadow-[0_0_0_3px_rgb(70_64_222_/_0.14)]"}
          ${className}`}
        {...rest}
      />
      {error && (
        <p id={helpId} className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {!error && success && (
        <p id={helpId} className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-success">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {success}
        </p>
      )}
    </div>
  );
}
