"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { createClusterRun } from "@/lib/cluster-service";
import { getPeriodPreset } from "@/lib/datetime";

const clusterSchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  k: z.coerce.number().int().min(2).max(5)
});

export async function runClusterAction(formData: FormData) {
  const actor = await requireRole(["admin", "petugas"]);
  const fallback = getPeriodPreset(30);
  const parsed = clusterSchema.safeParse({
    periodStart: formData.get("periodStart") || fallback.start,
    periodEnd: formData.get("periodEnd") || fallback.end,
    k: formData.get("k") || 3
  });

  if (!parsed.success || parsed.data.periodStart > parsed.data.periodEnd) {
    redirect("/analisis?notice=Periode analisis belum valid");
  }

  const { result } = await createClusterRun({
    ...parsed.data,
    createdBy: actor.id
  });

  revalidatePath("/analisis");
  revalidatePath("/dashboard");
  redirect(
    `/analisis?notice=${encodeURIComponent(
      `K-Means selesai: ${result.members.length} pengguna, silhouette ${result.silhouette.toFixed(2)}`
    )}`
  );
}
