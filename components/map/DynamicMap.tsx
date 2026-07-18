"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const DynamicMap = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-md" />,
});

export default DynamicMap;
