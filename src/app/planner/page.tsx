"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Planner from "@/components/Planner";

export default function PlannerPage() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <Planner onExit={() => router.push("/")} />
    </motion.div>
  );
}
