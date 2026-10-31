export type DescriptionInput = {
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  mileage: number;
  color?: string | null;
  certified?: boolean;
  features?: string[];
  retailCents?: number | null;
};

export type AssistantContext = {
  agedCount: number;
  needPhotos: number;
  pendingRecon: number;
  overMarket: number;
};

export type AssistantPlan = {
  reply: string;
  action:
    | { type: "none" }
    | { type: "reprice_aged"; minDays: number }
    | { type: "list_need_photos" }
    | { type: "list_pending_recon" }
    | { type: "wholesale_aged"; minDays: number }
    | { type: "turn_summary" };
};

export type AiProvider = {
  id: string;
  generateDescription(input: DescriptionInput): Promise<string>;
  planAssistant(prompt: string, context: AssistantContext): Promise<AssistantPlan>;
};

function demoDescription(input: DescriptionInput): string {
  const title = [input.year, input.make, input.model, input.trim].filter(Boolean).join(" ");
  const bits = [
    `${title} with ${input.mileage.toLocaleString()} miles.`,
    input.color ? `${input.color} exterior.` : null,
    input.certified ? "Certified pre-owned eligible." : null,
    input.features?.length ? `Highlights: ${input.features.slice(0, 6).join(", ")}.` : null,
    "Priced against live CarsXE retail clean. Call to confirm availability and schedule a drive.",
  ];
  return bits.filter(Boolean).join(" ");
}

export function planFromPrompt(prompt: string, context: AssistantContext): AssistantPlan {
  const text = prompt.toLowerCase();
  if (/reprice|mark.?down|price down/.test(text) && /(60|45|aged|day)/.test(text)) {
    const minDays = /\b45\b/.test(text) ? 45 : 60;
    return {
      reply: `I’ll reprice ${context.agedCount} unit(s) at or past ${minDays} days to the Turn Score suggested list.`,
      action: { type: "reprice_aged", minDays },
    };
  }
  if (/photo|images|merch/.test(text)) {
    return {
      reply: `${context.needPhotos} unit(s) still need a photo pack.`,
      action: { type: "list_need_photos" },
    };
  }
  if (/recon|approval|estimate/.test(text)) {
    return {
      reply: `${context.pendingRecon} recon line(s) are waiting on approval.`,
      action: { type: "list_pending_recon" },
    };
  }
  if (/wholesale/.test(text)) {
    const minDays = /\b45\b/.test(text) ? 45 : 60;
    return {
      reply: `I’ll move ${minDays}+ day units that Turn Score flags for wholesale.`,
      action: { type: "wholesale_aged", minDays },
    };
  }
  if (/turn score|summary|how is the lot/.test(text)) {
    return {
      reply: `Lot snapshot: ${context.agedCount} aged, ${context.overMarket} over market, ${context.needPhotos} missing photos, ${context.pendingRecon} recon approvals.`,
      action: { type: "turn_summary" },
    };
  }
  return {
    reply:
      "I can reprice 60+ day units, list units that need photos, show pending recon approvals, or move aged units to wholesale. Try: “reprice my 60+ day units to market”.",
    action: { type: "none" },
  };
}

export const demoAiProvider: AiProvider = {
  id: "demo",
  async generateDescription(input) {
    return demoDescription(input);
  },
  async planAssistant(prompt, context) {
    return planFromPrompt(prompt, context);
  },
};

async function postJson<T>(url: string, key: string | undefined, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`AI provider request failed (${response.status})`);
  return (await response.json()) as T;
}

export function getAiProvider(): AiProvider {
  const kind = process.env.AI_PROVIDER ?? "demo";
  if (kind === "http" && process.env.AI_PROVIDER_URL) {
    const url = process.env.AI_PROVIDER_URL.replace(/\/$/, "");
    const key = process.env.AI_PROVIDER_KEY;
    return {
      id: "http",
      async generateDescription(input) {
        try {
          const result = await postJson<{ description?: string }>(`${url}/describe`, key, input);
          return result.description || demoDescription(input);
        } catch {
          return demoDescription(input);
        }
      },
      async planAssistant(prompt, context) {
        try {
          const result = await postJson<AssistantPlan>(`${url}/assistant`, key, { prompt, context });
          return result.action ? result : planFromPrompt(prompt, context);
        } catch {
          return planFromPrompt(prompt, context);
        }
      },
    };
  }
  if (kind === "openai" && process.env.AI_PROVIDER_KEY) {
    return {
      id: "openai",
      async generateDescription(input) {
        try {
          const result = await postJson<{
            choices?: Array<{ message?: { content?: string } }>;
          }>("https://api.openai.com/v1/chat/completions", process.env.AI_PROVIDER_KEY, {
            model: process.env.AI_PROVIDER_MODEL ?? "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "Write a short dealer-grade used-vehicle listing description. No hype, no invented history.",
              },
              { role: "user", content: JSON.stringify(input) },
            ],
          });
          return result.choices?.[0]?.message?.content?.trim() || demoDescription(input);
        } catch {
          return demoDescription(input);
        }
      },
      async planAssistant(prompt, context) {
        return planFromPrompt(prompt, context);
      },
    };
  }
  return demoAiProvider;
}
