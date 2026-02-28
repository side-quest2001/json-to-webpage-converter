import type { JsonObject, JsonValue } from "../types";

export const parseJsonInput = (raw: string): JsonValue => {
  const parsed: unknown = JSON.parse(raw);
  return sanitizeJson(parsed);
};

const sanitizeJson = (value: unknown): JsonValue => {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJson(item));
  }

  if (typeof value === "object") {
    const out: JsonObject = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = sanitizeJson(child);
    }
    return out;
  }

  throw new Error("Unsupported JSON value encountered.");
};

export const exampleJson = `{
  "title": "Monthly Sales Report",
  "metadata": {
    "period": "February 2026",
    "generatedBy": "Ops Team",
    "currency": "USD"
  },
  "summary": {
    "totalRevenue": 245000,
    "totalOrders": 1120,
    "returnRate": 0.023
  },
  "topProducts": [
    {
      "name": "Noise-Cancelling Headphones",
      "unitsSold": 280,
      "revenue": 56000
    },
    {
      "name": "Mechanical Keyboard",
      "unitsSold": 190,
      "revenue": 28500
    },
    {
      "name": "4K Monitor",
      "unitsSold": 145,
      "revenue": 72500
    }
  ],
  "notes": [
    "Revenue increased by 12% compared to January.",
    "Returns remained below 3% target threshold."
  ]
}`;
