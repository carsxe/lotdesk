export type InspectionDraftTag = {
  x: number;
  y: number;
  label: string;
  severity: "NOTE" | "MINOR" | "MAJOR";
};

export type InspectionDraft = {
  grade: string;
  provider: string;
  tags: InspectionDraftTag[];
  notes?: string;
};

export type InspectionProvider = {
  id: string;
  analyze(input: { imageUrl?: string; notes?: string }): Promise<InspectionDraft>;
};

export const manualInspectionProvider: InspectionProvider = {
  id: "manual",
  async analyze(input) {
    return {
      grade: "CLEAN",
      provider: "manual",
      tags: [],
      notes: input.notes,
    };
  },
};

export function getInspectionProvider(): InspectionProvider {
  const kind = process.env.INSPECTION_PROVIDER ?? "demo";
  if (kind === "http" && process.env.INSPECTION_PROVIDER_URL) {
    const url = process.env.INSPECTION_PROVIDER_URL.replace(/\/$/, "");
    const key = process.env.INSPECTION_PROVIDER_KEY;
    return {
      id: "http",
      async analyze(input) {
        try {
          const response = await fetch(`${url}/analyze`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(key ? { Authorization: `Bearer ${key}` } : {}),
            },
            body: JSON.stringify(input),
          });
          if (!response.ok) throw new Error("inspection provider failed");
          return (await response.json()) as InspectionDraft;
        } catch {
          return manualInspectionProvider.analyze(input);
        }
      },
    };
  }
  return manualInspectionProvider;
}
