import type { Metadata } from "next";
import { DemoPreview } from "@/components/DemoPreview";

export const metadata: Metadata = {
  title: "Vista de Ejemplo · Amigo Secreto Familiar",
  description: "Simulador interactivo para ver cómo los participantes reciben su enlace.",
};

export default function DemoPage() {
  return <DemoPreview />;
}
