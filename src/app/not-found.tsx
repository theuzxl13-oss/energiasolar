import Link from "next/link";
import { ArrowLeft, PlugZap } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-black px-4 text-center text-white">
      <div className="absolute inset-0 bg-grid mask-fade" aria-hidden="true" />
      <div className="relative">
        <PlugZap className="mx-auto size-12 text-brand-400" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-display mt-6 text-white">404</p>
        <h1 className="text-title mt-6">Parece que esta página ficou sem energia.</h1>
        <p className="mt-4 font-extralight text-mist">O endereço acessado não existe ou foi movido.</p>
        <Link href="/" className={buttonStyles({ className: "mt-10" })}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para o início
        </Link>
      </div>
    </main>
  );
}
