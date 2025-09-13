import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

export const addImageWithAnalysis = mutation({
  args: {
    fieldId: v.id("fields"),
    filename: v.string(),
    fileSize: v.number(),
    indices: v.object({
      ndviApprox: v.optional(v.number()),
      dryness: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Verify field ownership
    const field = await ctx.db.get(args.fieldId);
    if (!field || field.ownerId !== user._id) {
      throw new Error("Field not found or access denied");
    }

    // Insert into images table. s3Key is required in schema; store filename as a placeholder key.
    const imageId = await ctx.db.insert("images", {
      fieldId: args.fieldId,
      uploadedBy: user._id,
      filename: args.filename,
      s3Key: args.filename,
      fileSize: args.fileSize,
      captureDate: Date.now(),
      processingStatus: "completed",
      metadata: {},
      indices: {
        ndvi: args.indices.ndviApprox,
        savi: undefined,
        evi: undefined,
      },
    });

    // Optionally create an alert if dryness is high or green is low
    const dryness = args.indices.dryness ?? 0;
    const ndvi = args.indices.ndviApprox ?? 0;

    if (dryness > 0.4 || ndvi < 0.3) {
      await ctx.db.insert("alerts", {
        fieldId: args.fieldId,
        userId: user._id,
        severity: dryness > 0.6 || ndvi < 0.2 ? ("high" as any) : ("medium" as any),
        type: "disease_detected" as any,
        title: "Potential Plant Stress Detected",
        description:
          "Automated analysis suggests stress indicators. Review field conditions and consider action.",
        coordinates: undefined,
        metadata: {
          confidence: Math.min(0.95, Math.max(0.5, 1 - ndvi + dryness)),
          affectedArea: 0.5,
        },
      });
    }

    return { imageId, ndvi, dryness };
  },
});
