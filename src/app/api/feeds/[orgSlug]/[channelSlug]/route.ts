import { contentTypeFor, getSyndicationAdapter, type FeedFormat } from "@/lib/syndication";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orgSlug: string; channelSlug: string }> },
) {
  const { orgSlug, channelSlug } = await context.params;
  const channel = await prisma.syndicationChannel.findFirst({
    where: {
      slug: channelSlug,
      enabled: true,
      organization: { slug: orgSlug },
    },
    include: {
      organization: true,
      listings: {
        where: { status: "LIVE" },
        include: { vehicle: { include: { photos: true } } },
      },
    },
  });
  if (!channel) {
    return NextResponse.json({ error: "Feed not found." }, { status: 404 });
  }

  const format = (channel.format as FeedFormat) || "json";
  const adapter = getSyndicationAdapter(channel.adapter);
  const body = adapter.serialize(
    channel.listings.map((listing) => ({
      vin: listing.vehicle.vin,
      stockNumber: listing.vehicle.stockNumber,
      year: listing.vehicle.year,
      make: listing.vehicle.make,
      model: listing.vehicle.model,
      trim: listing.vehicle.trim,
      mileage: listing.vehicle.mileage,
      listPriceCents: listing.vehicle.listPriceCents,
      color: listing.vehicle.color,
      description: listing.vehicle.description ?? listing.vehicle.aiDescription,
      certified: listing.vehicle.certified,
      photoUrls: listing.vehicle.photos.map((photo) => photo.url),
    })),
    format,
  );

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentTypeFor(format),
      "Cache-Control": "public, max-age=120",
    },
  });
}
