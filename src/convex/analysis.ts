"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const computeMetrics = action({
  args: {
    rgba: v.bytes(),
    width: v.number(),
    height: v.number(),
  },
  handler: async (ctx, args) => {
    const { rgba, width, height } = args;
    if (width <= 0 || height <= 0) {
      throw new Error("Invalid image dimensions");
    }
    // rgba is a raw ArrayBuffer; convert to Uint8ClampedArray for iteration
    const data = new Uint8ClampedArray(rgba);

    let greenish = 0;
    let dryish = 0;
    let total = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 20) continue;
      total++;
      if (g > r && g > b && g > 60) greenish++;
      if (r > g && r > b && r > 80) dryish++;
    }

    const greenRatio = total > 0 ? greenish / total : 0;
    const dryRatio = total > 0 ? dryish / total : 0;

    const healthCondition =
      greenRatio >= 0.6 && dryRatio < 0.2
        ? ("Healthy" as const)
        : greenRatio >= 0.35 && dryRatio < 0.35
        ? ("Moderate" as const)
        : ("Stressed" as const);

    const growthStage =
      greenRatio > 0.65
        ? ("Vegetative" as const)
        : greenRatio > 0.5
        ? ("Flowering" as const)
        : greenRatio > 0.35
        ? ("Maturation" as const)
        : ("Seedling" as const);

    const possibleDiseases: Array<string> = [];
    if (dryRatio > 0.35) possibleDiseases.push("Drought Stress");
    if (greenRatio < 0.3) possibleDiseases.push("Nutrient Deficiency");
    if (greenRatio >= 0.3 && greenRatio < 0.5 && dryRatio >= 0.2) {
      possibleDiseases.push("Leaf Scorch (placeholder)");
    }

    const names = ["Maize (placeholder)", "Wheat (placeholder)", "Soybean (placeholder)", "Tomato (placeholder)"];
    const plantName = names[Math.floor(greenRatio * names.length)] || "Unknown (placeholder)";

    return {
      greenRatio,
      dryRatio,
      healthCondition,
      growthStage,
      possibleDiseases,
      plantName,
    };
  },
});
