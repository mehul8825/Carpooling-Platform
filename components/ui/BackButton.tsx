"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function BackButton({ title = "Back" }: { title?: string }) {
  const router = useRouter();

  return (
    <Button variant="ghost" className="mb-4 text-slate-500 hover:text-slate-800" onClick={() => router.back()}>
      <ArrowLeft className="w-4 h-4 mr-2" />
      {title}
    </Button>
  );
}
