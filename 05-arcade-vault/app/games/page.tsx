import type { Metadata } from "next";
import { Library } from "@/components/library";

export const metadata: Metadata = { title: "Biblioteca" };

export default function GamesPage() {
  return <Library />;
}
