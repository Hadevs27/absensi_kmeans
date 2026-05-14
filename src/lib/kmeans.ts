import type { AttendanceFeature } from "@/lib/attendance-metrics";

export type ClusteredMember = AttendanceFeature & {
  clusterIndex: number;
  label: string;
  distance: number;
};

export type KMeansResult = {
  members: ClusteredMember[];
  centroids: number[][];
  labels: string[];
  silhouette: number;
  iterations: number;
  summary: Array<{
    clusterIndex: number;
    label: string;
    members: number;
    centroid: number[];
  }>;
};

function vectorOf(item: AttendanceFeature) {
  const total = Math.max(1, item.total);
  return [
    item.present / total,
    item.late / total,
    item.permission / total,
    item.sick / total,
    item.leave / total,
    item.absent / total
  ];
}

function distance(a: number[], b: number[]) {
  return Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0));
}

function average(vectors: number[][], fallback: number[]) {
  if (vectors.length === 0) return fallback;
  return vectors[0].map((_, index) => {
    const total = vectors.reduce((sum, vector) => sum + vector[index], 0);
    return total / vectors.length;
  });
}

function labelCentroid(centroid: number[]) {
  const [present, late, permission, sick, leave, absent] = centroid;
  const nonAttendance = permission + sick + leave;

  if (absent >= 0.24) return "Rawan Alfa";
  if (late >= 0.2) return "Sering Terlambat";
  if (nonAttendance >= 0.28) return "Sering Izin/Sakit";
  if (present + late >= 0.86 && late < 0.12 && absent < 0.08) return "Rajin";
  return "Cukup Stabil";
}

function pickInitialCentroids(vectors: number[][], k: number, items: AttendanceFeature[]) {
  const ranked = vectors
    .map((vector, index) => ({
      vector,
      score:
        vector[0] * 1.2 +
        vector[1] * 0.65 -
        vector[2] * 0.25 -
        vector[3] * 0.2 -
        vector[4] * 0.2 -
        vector[5] * 1.4 +
        items[index].total / 100
    }))
    .sort((a, b) => a.score - b.score);

  return Array.from({ length: k }, (_, index) => {
    const position =
      k === 1 ? 0 : Math.round((index * (ranked.length - 1)) / Math.max(1, k - 1));
    return [...ranked[position].vector];
  });
}

function silhouetteScore(vectors: number[][], assignments: number[], k: number) {
  if (vectors.length <= 1 || k <= 1) return 0;

  const scores = vectors.map((vector, index) => {
    const ownCluster = assignments[index];
    const sameCluster = vectors.filter((_, otherIndex) => {
      return otherIndex !== index && assignments[otherIndex] === ownCluster;
    });

    const a =
      sameCluster.length === 0
        ? 0
        : sameCluster.reduce((sum, other) => sum + distance(vector, other), 0) /
          sameCluster.length;

    const b = Math.min(
      ...Array.from({ length: k }, (_, clusterIndex) => {
        if (clusterIndex === ownCluster) return Number.POSITIVE_INFINITY;
        const others = vectors.filter((_, otherIndex) => assignments[otherIndex] === clusterIndex);
        if (others.length === 0) return Number.POSITIVE_INFINITY;
        return others.reduce((sum, other) => sum + distance(vector, other), 0) / others.length;
      })
    );

    if (!Number.isFinite(b) || Math.max(a, b) === 0) return 0;
    return (b - a) / Math.max(a, b);
  });

  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

export function runKMeans(items: AttendanceFeature[], requestedK: number): KMeansResult {
  const usableItems = items.filter((item) => item.total > 0);
  const sourceItems = usableItems.length > 0 ? usableItems : items;
  const k = Math.max(1, Math.min(requestedK, sourceItems.length || 1));
  const vectors = sourceItems.map(vectorOf);

  if (sourceItems.length === 0) {
    return {
      members: [],
      centroids: [],
      labels: [],
      silhouette: 0,
      iterations: 0,
      summary: []
    };
  }

  let centroids = pickInitialCentroids(vectors, k, sourceItems);
  let assignments = new Array<number>(sourceItems.length).fill(-1);
  let iterations = 0;

  for (let iteration = 0; iteration < 50; iteration += 1) {
    iterations = iteration + 1;
    let changed = false;

    assignments = vectors.map((vector, itemIndex) => {
      const distances = centroids.map((centroid) => distance(vector, centroid));
      const nextAssignment = distances.indexOf(Math.min(...distances));
      if (nextAssignment !== assignments[itemIndex]) changed = true;
      return nextAssignment;
    });

    const nextCentroids = centroids.map((centroid, clusterIndex) => {
      const clusterVectors = vectors.filter((_, index) => assignments[index] === clusterIndex);
      return average(clusterVectors, centroid);
    });

    centroids = nextCentroids;
    if (!changed) break;
  }

  const labels = centroids.map(labelCentroid);
  const members = sourceItems.map((item, index) => {
    const clusterIndex = assignments[index];
    return {
      ...item,
      clusterIndex,
      label: labels[clusterIndex],
      distance: distance(vectors[index], centroids[clusterIndex])
    };
  });

  const summary = centroids.map((centroid, clusterIndex) => ({
    clusterIndex,
    label: labels[clusterIndex],
    members: members.filter((member) => member.clusterIndex === clusterIndex).length,
    centroid
  }));

  return {
    members,
    centroids,
    labels,
    silhouette: silhouetteScore(vectors, assignments, k),
    iterations,
    summary
  };
}
