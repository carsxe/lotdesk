import { SpinViewer } from "@/components/spin-viewer";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EmbedSpinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id },
    include: { spinFrames: true },
  });
  if (!vehicle || vehicle.spinFrames.length === 0) notFound();

  return (
    <main className="mx-auto max-w-3xl p-4">
      <p className="mb-2 text-sm text-muted-foreground">
        {vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.stockNumber}
      </p>
      <SpinViewer frames={vehicle.spinFrames} label={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} />
    </main>
  );
}
