import type { Metadata } from "next";
import { Chat } from "@/components/chat/Chat";

export const metadata: Metadata = { title: "Assistente IA" };

export default function Assistente() {
  return <Chat />;
}
