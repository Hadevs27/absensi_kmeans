import { desc, eq } from "drizzle-orm";

import { aggregateAttendanceFeatures } from "@/lib/attendance-metrics";
import { db } from "@/lib/db/client";
import { clusterMembers, clusterRuns, users } from "@/lib/db/schema";
import { runKMeans } from "@/lib/kmeans";

export async function createClusterRun(input: {
  periodStart: string;
  periodEnd: string;
  k: number;
  createdBy?: number | null;
}) {
  const features = await aggregateAttendanceFeatures(input.periodStart, input.periodEnd);
  const result = runKMeans(features, input.k);

  const created = await db
    .insert(clusterRuns)
    .values({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      k: Math.max(1, Math.min(input.k, Math.max(1, result.members.length))),
      silhouette: Number(result.silhouette.toFixed(4)),
      totalMembers: result.members.length,
      summaryJson: JSON.stringify(result.summary),
      createdBy: input.createdBy ?? null
    })
    .returning({ id: clusterRuns.id });

  const runId = created[0].id;

  if (result.members.length > 0) {
    await db.insert(clusterMembers).values(
      result.members.map((member) => ({
        runId,
        userId: member.userId,
        clusterIndex: member.clusterIndex,
        label: member.label,
        featuresJson: JSON.stringify({
          present: member.present,
          late: member.late,
          permission: member.permission,
          sick: member.sick,
          leave: member.leave,
          absent: member.absent,
          total: member.total
        }),
        distance: Number(member.distance.toFixed(4))
      }))
    );
  }

  return { runId, result };
}

export async function getLatestClusterRun() {
  const runs = await db.select().from(clusterRuns).orderBy(desc(clusterRuns.createdAt)).limit(1);
  const run = runs[0];
  if (!run) return null;

  const members = await db
    .select({
      id: clusterMembers.id,
      clusterIndex: clusterMembers.clusterIndex,
      label: clusterMembers.label,
      featuresJson: clusterMembers.featuresJson,
      distance: clusterMembers.distance,
      userName: users.name,
      identifier: users.identifier,
      department: users.department
    })
    .from(clusterMembers)
    .innerJoin(users, eq(clusterMembers.userId, users.id))
    .where(eq(clusterMembers.runId, run.id))
    .orderBy(clusterMembers.clusterIndex, users.name);

  return {
    run,
    members,
    summary: JSON.parse(run.summaryJson) as Array<{
      clusterIndex: number;
      label: string;
      members: number;
      centroid: number[];
    }>
  };
}
