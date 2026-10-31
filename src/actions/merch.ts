"use server";

import { getAiProvider } from "@/lib/adapters/ai";
import { getImageProvider } from "@/lib/adapters/image";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/server/session";
import { revalidatePath } from "next/cache";

export async function attachPhotoAction(formData: FormData) {
  const user = await requireUser();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, organizationId: user.organizationId },
  });
  if (!vehicle) return;

  const url = String(formData.get("url") ?? "");
  if (!url) {
    const fallback = `/api/demo-image?year=${vehicle.year}&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}&angle=front`;
    await prisma.photo.create({
      data: {
        organizationId: user.organizationId,
        vehicleId,
        kind: "RAW",
        url: fallback,
      },
    });
  } else {
    await prisma.photo.create({
      data: { organizationId: user.organizationId, vehicleId, kind: "RAW", url },
    });
  }
  revalidatePath("/app/photo-studio");
  revalidatePath("/app/promo-studio");
}

export async function restylePhotoAction(formData: FormData) {
  const user = await requireUser();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const mode = String(formData.get("mode") ?? "studio") as "studio" | "promo";
  const overlay = String(formData.get("overlay") ?? "") || undefined;
  const feature = String(formData.get("feature") ?? "") || undefined;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, organizationId: user.organizationId },
  });
  if (!vehicle) return;

  const raw = await prisma.photo.findFirst({
    where: { vehicleId, kind: "RAW" },
    orderBy: { createdAt: "desc" },
  });
  const provider = getImageProvider();
  const result = await provider.restyle({
    sourceUrl: raw?.url ?? "",
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    mode,
    overlay,
    feature,
  });
  await prisma.photo.create({
    data: {
      organizationId: user.organizationId,
      vehicleId,
      kind: result.kind,
      url: result.url,
      overlay: result.overlay,
    },
  });
  if (mode === "studio") {
    await prisma.vehicle.update({ where: { id: vehicleId }, data: { photoPackReady: true } });
  }
  revalidatePath("/app/photo-studio");
  revalidatePath("/app/promo-studio");
}

export async function generateDescriptionAction(formData: FormData) {
  const user = await requireUser();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, organizationId: user.organizationId },
  });
  if (!vehicle) return;
  const description = await getAiProvider().generateDescription({
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    mileage: vehicle.mileage,
    color: vehicle.color,
    certified: vehicle.certified,
    retailCents: vehicle.marketRetailCents,
  });
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { aiDescription: description, description },
  });
  revalidatePath("/app/assistant");
  revalidatePath(`/app/inventory/${vehicleId}`);
}

export async function addSpinFramesAction(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, organizationId: user.organizationId },
  });
  if (!vehicle) return;

  await prisma.spinFrame.deleteMany({ where: { vehicleId } });
  const frames = Array.from({ length: 12 }, (_, index) => ({
    vehicleId,
    index,
    url: `/api/demo-image?year=${vehicle.year}&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}&angle=spin-${index}`,
  }));
  await prisma.spinFrame.createMany({ data: frames });
  revalidatePath("/app/spin");
}
