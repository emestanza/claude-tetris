import type { Metadata } from "next";
import { HomePage } from "@/components/home/home-page";

export const metadata: Metadata = {
  description: "Juega los mejores clásicos del arcade en tu navegador y compite por el puntaje más alto.",
};

export default function Home() {
  return <HomePage />;
}
