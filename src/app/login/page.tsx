import type { Metadata } from "next";
import { Suspense } from "react";
import { Leaf } from "lucide-react";
import { FormLogin } from "@/components/auth/FormLogin";

export const metadata: Metadata = { title: "Entrar" };

export default function Login() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-brand-dark p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Leaf className="size-8 text-green-600" aria-hidden />
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-brand-dark">STI Atende</h1>
            <p className="text-xs text-gray-500">SEMA-MT · Suporte de TI com assistente de IA</p>
          </div>
        </div>
        <Suspense>
          <FormLogin />
        </Suspense>
      </section>
    </main>
  );
}
