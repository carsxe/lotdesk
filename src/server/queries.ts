import { analyzePrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

export async function dashboardMetrics(organizationId: string) {
  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId, status: { not: "SOLD" } },
    include: { rooftop: true },
  });
  const appraisals = await prisma.appraisal.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { rooftop: true, appraiser: true },
  });
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const usage = await prisma.apiUsage.findMany({
    where: { organizationId, createdAt: { gte: monthStart } },
  });

  const analyses = vehicles.map((vehicle) =>
    analyzePrice({
      listCents: vehicle.listPriceCents,
      marketRetailCents: vehicle.marketRetailCents,
      acquiredAt: vehicle.acquiredAt,
      agingThresholdDays: vehicle.rooftop.agingThresholdDays,
    }),
  );

  const inStock = vehicles.length;
  const aged = analyses.filter((item) => item.aging).length;
  const over = analyses.filter((item) => item.flag === "over").length;
  const under = analyses.filter((item) => item.flag === "under").length;
  const recon = vehicles.filter((item) => item.status === "IN_RECON").length;
  const avgDays =
    inStock === 0 ? 0 : Math.round(analyses.reduce((sum, item) => sum + item.daysInStock, 0) / inStock);
  const investment = vehicles.reduce((sum, item) => sum + item.costCents, 0);
  const asking = vehicles.reduce((sum, item) => sum + item.listPriceCents, 0);

  return {
    inStock,
    aged,
    over,
    under,
    recon,
    avgDays,
    investment,
    asking,
    appraisals,
    usage: {
      billed: usage.filter((item) => item.billed).length,
      cached: usage.filter((item) => item.cacheHit).length,
      demo: usage.filter((item) => item.demo).length,
      total: usage.length,
    },
    vehicles: vehicles.map((vehicle, index) => ({ vehicle, analysis: analyses[index] })),
    reconCounts: {
      INTAKE: vehicles.filter((v) => v.reconStage === "INTAKE" && v.status === "IN_RECON").length,
      MECHANICAL: vehicles.filter((v) => v.reconStage === "MECHANICAL" && v.status === "IN_RECON").length,
      BODY: vehicles.filter((v) => v.reconStage === "BODY" && v.status === "IN_RECON").length,
      DETAIL: vehicles.filter((v) => v.reconStage === "DETAIL" && v.status === "IN_RECON").length,
      PHOTOS: vehicles.filter((v) => v.reconStage === "PHOTOS" && v.status === "IN_RECON").length,
      READY: vehicles.filter((v) => v.reconStage === "READY").length,
    },
  };
}
