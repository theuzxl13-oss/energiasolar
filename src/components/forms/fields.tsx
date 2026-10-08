import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

/*
 * Campos de formulário acessíveis, compatíveis com react-hook-form (forwardRef).
 * Estilo "linha": sem caixa, apenas um traço inferior que acende no foco.
 */

const controlBase =
  "w-full border-0 border-b bg-transparent px-0 text-lg font-extralight text-white outline-none transition-colors placeholder:text-white/30 focus:border-brand-400 focus:ring-0 disabled:opacity-50";

interface FieldWrapperProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ id, label, error, hint, required, className, children }: FieldWrapperProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="label-caps text-ash">
        {label}
        {required && <span className="ml-1 text-spark" aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs font-extralight text-ash">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  prefix?: string;
  wrapperClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField(
  { label, error, hint, prefix, wrapperClassName, className, required, id: idProp, ...props },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-lg font-extralight text-ash">{prefix}</span>}
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(controlBase, "h-12", prefix && "pl-9", error ? "border-rose-400" : "border-white/20", className)}
          {...props}
        />
      </div>
    </FieldWrapper>
  );
});

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  wrapperClassName?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField(
  { label, error, hint, options, placeholder, wrapperClassName, className, required, id: idProp, ...props },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      <select
        ref={ref}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          controlBase,
          "h-12 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239a9a9a%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_2px_center] bg-no-repeat pr-8 [&>option]:bg-black [&>option]:text-white",
          error ? "border-rose-400" : "border-white/20",
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
});

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaProps>(function TextareaField(
  { label, error, hint, wrapperClassName, className, required, id: idProp, ...props },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      <textarea
        ref={ref}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(controlBase, "min-h-28 resize-y py-3", error ? "border-rose-400" : "border-white/20", className)}
        {...props}
      />
    </FieldWrapper>
  );
});

/** Grupo de opções em texto (radio acessível): a opção ativa acende em branco com marcador verde. */
interface ChoiceGroupProps<T extends string> {
  label: string;
  name: string;
  value: T | "";
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  error?: string;
  columns?: string;
}

export function ChoiceGroup<T extends string>({ label, name, value, onChange, options, error }: ChoiceGroupProps<T>) {
  return (
    <fieldset>
      <legend className="label-caps text-ash">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2 rounded-3xl border px-4 text-sm transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-400",
                checked ? "border-brand-400 text-white" : "border-white/15 text-ash hover:border-white/40 hover:text-white",
              )}
            >
              <input type="radio" name={name} value={option.value} checked={checked} onChange={() => onChange(option.value)} className="sr-only" />
              <span className={cn("size-1.5 rounded-full", checked ? "bg-brand-400" : "bg-white/20")} aria-hidden="true" />
              {option.label}
            </label>
          );
        })}
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-rose-400">{error}</p>}
    </fieldset>
  );
}
