import { redirect } from "next/navigation";

// O Assistente IA é a porta de entrada, como no protótipo.
export default function Inicio() {
  redirect("/assistente");
}
