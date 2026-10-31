export type ImageRestyle = {
  url: string;
  kind: "CUTOUT" | "PROMO";
  overlay?: string;
};

export type ImageProvider = {
  id: string;
  restyle(input: {
    sourceUrl: string;
    year: number;
    make: string;
    model: string;
    mode: "studio" | "promo";
    overlay?: string;
    feature?: string;
  }): Promise<ImageRestyle>;
};

function demoStudioUrl(input: { year: number; make: string; model: string }): string {
  const params = new URLSearchParams({
    year: String(input.year),
    make: input.make,
    model: input.model,
    studio: "showroom",
    angle: "side",
  });
  return `/api/demo-image?${params.toString()}`;
}

function demoPromoUrl(input: {
  year: number;
  make: string;
  model: string;
  overlay?: string;
  feature?: string;
}): string {
  const params = new URLSearchParams({
    year: String(input.year),
    make: input.make,
    model: input.model,
    studio: "showroom",
    overlay: input.overlay ?? "feature",
    angle: "front",
  });
  if (input.feature) params.set("feature", input.feature);
  return `/api/demo-image?${params.toString()}`;
}

export const demoImageProvider: ImageProvider = {
  id: "demo",
  async restyle(input) {
    if (input.mode === "promo") {
      return {
        url: demoPromoUrl(input),
        kind: "PROMO",
        overlay: input.overlay ?? "feature",
      };
    }
    return { url: demoStudioUrl(input), kind: "CUTOUT" };
  },
};

export function getImageProvider(): ImageProvider {
  const kind = process.env.IMAGE_PROVIDER ?? "demo";
  if (kind === "http" && process.env.IMAGE_PROVIDER_URL) {
    const url = process.env.IMAGE_PROVIDER_URL.replace(/\/$/, "");
    const key = process.env.IMAGE_PROVIDER_KEY;
    return {
      id: "http",
      async restyle(input) {
        try {
          const response = await fetch(`${url}/restyle`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(key ? { Authorization: `Bearer ${key}` } : {}),
            },
            body: JSON.stringify(input),
          });
          if (!response.ok) throw new Error("image provider failed");
          return (await response.json()) as ImageRestyle;
        } catch {
          return demoImageProvider.restyle(input);
        }
      },
    };
  }
  return demoImageProvider;
}
