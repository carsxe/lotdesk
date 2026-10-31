"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/session";
import type { SyndicationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function upsertChannelAction(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const name = String(formData.get("name") ?? "Website");
  const slug = String(formData.get("slug") ?? "website")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const format = String(formData.get("format") ?? "json");
  await prisma.syndicationChannel.upsert({
    where: { organizationId_slug: { organizationId: user.organizationId, slug } },
    update: { name, format, enabled: true },
    create: {
      organizationId: user.organizationId,
      name,
      slug,
      format,
      adapter: process.env.SYNDICATION_ADAPTER ?? "lotdesk-feed",
    },
  });
  revalidatePath("/app/feeds");
}

export async function syncChannelAction(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const channelId = String(formData.get("channelId") ?? "");
  const channel = await prisma.syndicationChannel.findFirst({
    where: { id: channelId, organizationId: user.organizationId },
  });
  if (!channel) return;

  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: user.organizationId, status: { in: ["FRONTLINE", "WHOLESALE"] } },
  });
  for (const vehicle of vehicles) {
    await prisma.syndicationListing.upsert({
      where: { vehicleId_channelId: { vehicleId: vehicle.id, channelId } },
      update: { status: "LIVE", lastSyncAt: new Date(), error: null },
      create: { vehicleId: vehicle.id, channelId, status: "LIVE", lastSyncAt: new Date() },
    });
  }
  revalidatePath("/app/feeds");
}

export async function setListingStatusAction(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "PAUSED") as SyndicationStatus;
  await prisma.syndicationListing.updateMany({
    where: { id, channel: { organizationId: user.organizationId } },
    data: { status },
  });
  revalidatePath("/app/feeds");
}
