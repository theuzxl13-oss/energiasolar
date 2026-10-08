"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, LoaderCircle, Send, TriangleAlert } from "lucide-react";
import { contactFormSchema, type ContactFormData, type ContactFormInput } from "@/lib/validations/lead";
import { BRAZILIAN_STATES } from "@/lib/brazil";
import { SERVICE_LABELS } from "@/lib/labels";
import { SERVICE_TYPES } from "@/types";
import { maskPhone } from "@/lib/utils";
import { ApiError, submitContact } from "@/services/api-client";
import { saveDemoLead } from "@/hooks/use-demo-leads";
import { SelectField, TextField, TextareaField } from "./fields";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput, unknown, ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      city: "",
      state: "" as ContactFormInput["state"],
      subject: "" as ContactFormInput["subject"],
      message: "",
      consent: false,
      website: "",
    },
  });

  async function onSubmit(data: ContactFormData) {
    setServerError(null);
    try {
      const { lead } = await submitContact(data);
      if (lead) saveDemoLead(lead);
      setSent(true);
      reset();
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (messages?.[0]) setError(field as keyof ContactFormInput, { message: messages[0] });
        }
      }
      setServerError(error instanceof Error ? error.message : "Não foi possível enviar.");
    }
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-start border-t border-white/10 pt-10">
        <CircleCheck className="size-10 text-brand-400" aria-hidden="true" />
        <h2 className="text-title mt-6 text-white">Mensagem enviada com sucesso!</h2>
        <p className="text-lead mt-4 text-mist">Em breve nossa equipe entrará em contato.</p>
        <Button variant="ghost" className="mt-6" onClick={() => setSent(false)}>
          Enviar nova mensagem
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative grid gap-9 sm:grid-cols-2">
      <h2 className="text-title text-white sm:col-span-2">Envie uma mensagem</h2>
      {serverError && (
        <p role="alert" className="flex items-start gap-2 border-l-2 border-rose-400 pl-4 text-sm text-rose-300 sm:col-span-2">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {serverError}
        </p>
      )}
      <TextField label="Nome" autoComplete="name" required {...register("name")} error={errors.name?.message} wrapperClassName="sm:col-span-2" />
      <TextField
        label="WhatsApp"
        type="tel"
        inputMode="tel"
        placeholder="(00) 00000-0000"
        autoComplete="tel-national"
        required
        {...register("phone", { onChange: (event) => setValue("phone", maskPhone(event.target.value)) })}
        error={errors.phone?.message}
      />
      <TextField label="E-mail" type="email" autoComplete="email" required {...register("email")} error={errors.email?.message} />
      <TextField label="Cidade" autoComplete="address-level2" required {...register("city")} error={errors.city?.message} />
      <SelectField
        label="Estado"
        placeholder="Selecione"
        options={BRAZILIAN_STATES.map((state) => ({ value: state.uf, label: `${state.name} (${state.uf})` }))}
        required
        {...register("state")}
        error={errors.state?.message}
      />
      <SelectField
        label="Assunto"
        placeholder="Selecione"
        options={SERVICE_TYPES.map((value) => ({ value, label: SERVICE_LABELS[value] }))}
        required
        {...register("subject")}
        error={errors.subject?.message}
        wrapperClassName="sm:col-span-2"
      />
      <TextareaField label="Mensagem" required maxLength={2000} {...register("message")} error={errors.message?.message} wrapperClassName="sm:col-span-2" />

      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="sm:col-span-2">
        <label className="flex cursor-pointer items-start gap-3 text-sm font-extralight text-mist">
          <input type="checkbox" {...register("consent")} className="mt-0.5 size-5 shrink-0 accent-brand-400" />
          <span>
            Autorizo o contato conforme a{" "}
            <Link href="/politica-de-privacidade" className="text-white underline underline-offset-4 hover:text-brand-300">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>
        {errors.consent?.message && <p role="alert" className="mt-1.5 text-xs text-rose-400">{errors.consent.message}</p>}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="justify-self-start sm:col-span-2">
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
        {isSubmitting ? "Enviando…" : "Enviar mensagem"}
      </Button>
    </form>
  );
}
