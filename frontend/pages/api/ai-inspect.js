const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const stripCodeFences = (value = "") =>
  value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

const tryParseJson = (value = "") => {
  try {
    return JSON.parse(stripCodeFences(value));
  } catch {
    return null;
  }
};

const extractMessageText = (content) => {
  if (!content) return "";
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part?.type === "text") return part.text || "";
        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error: "Missing GROQ_API_KEY. Add it to frontend/.env.local",
    });
  }

  const property = req.body?.property;

  if (!property) {
    return res.status(400).json({ error: "Property payload is required" });
  }

  const model =
    process.env.GROQ_VISION_MODEL ||
    "meta-llama/llama-4-scout-17b-16e-instruct";

  const prompt = `You are assisting a real-estate inspector.

Review the property carefully using the provided listing data and image.
Do NOT claim legal certainty or structural certainty.
Only make cautious visual and metadata-based observations.

Return ONLY valid JSON with this exact shape:
{
  "verdict": "approve" | "review" | "reject",
  "score": number,
  "confidence": number,
  "summary": string,
  "reasons": string[],
  "redFlags": string[],
  "checks": {
    "imageQuality": "good" | "fair" | "poor",
    "visibleCondition": "good" | "average" | "poor" | "unclear",
    "metadataConsistency": "consistent" | "partially_consistent" | "inconsistent" | "unclear",
    "documentPresence": "present" | "missing",
    "riskLevel": "low" | "medium" | "high"
  },
  "recommendedNextSteps": string[]
}

Scoring rubric:
- Start from 50.
- Add points for clear image quality, plausible property presentation, and complete metadata.
- Deduct points for poor image quality, suspicious mismatch, missing docs, or uncertainty.
- Use "review" whenever evidence is incomplete.

Listing metadata:
${JSON.stringify(
  {
    id: property.id,
    name: property.name,
    description: property.description,
    location: property.location,
    propertyType: property.propertyType,
    area: property.area,
    seller: property.seller,
    currentOwner: property.currentOwner,
    documents: property.documents || null,
    priceEth: property.price,
  },
  null,
  2
)}`;

  const body = {
    model,
    temperature: 0.2,
    max_completion_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          "You are a careful assistant for property inspection support. Return only valid JSON.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...(property.image
            ? [
                {
                  type: "image_url",
                  image_url: {
                    url: property.image,
                  },
                },
              ]
            : []),
        ],
      },
    ],
  };

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: payload?.error?.message || "Groq request failed",
        details: payload,
      });
    }

    const rawText = extractMessageText(
      payload?.choices?.[0]?.message?.content
    );

    const result = tryParseJson(rawText);

    if (!result) {
      return res.status(502).json({
        error: "AI response was not valid JSON",
        rawText,
      });
    }

    return res.status(200).json({
      model,
      result,
      rawText,
    });
  } catch (error) {
    console.error("AI inspection route failed:", error);
    return res.status(500).json({
      error: error.message || "Failed to run AI inspection",
    });
  }
}