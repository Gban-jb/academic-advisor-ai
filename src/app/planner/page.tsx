"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Planner from "@/components/Planner";
import { hasProgram } from "@/lib/programs";

function PlannerContent() {
  const router = useRouter();
  const params = useSearchParams();
  // Ignore unknown majors — falls back to Computer Science.
  const requested = params.get("major") ?? undefined;
  const major = requested && hasProgram(requested) ? requested : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <Planner onExit={() => router.push("/")} major={major} />
    </motion.div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense>
      <PlannerContent />
    </Suspense>
  );
}
