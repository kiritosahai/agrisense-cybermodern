import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const createAlert = mutation({
  args: {
    fieldId: v.id("fields"),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    type: v.union(
      v.literal("pest_risk"),
      v.literal("disease_detected"),
      v.literal("irrigation_needed"),
      v.literal("harvest_ready"),
      v.literal("weather_warning")
    ),
    title: v.string(),
    description: v.string(),
    coordinates: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    metadata: v.optional(v.object({
      confidence: v.optional(v.number()),
      affectedArea: v.optional(v.number()),
    })),
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

    return await ctx.db.insert("alerts", {
      ...args,
      userId: user._id,
    });
  },
});

export const getUserAlerts = query({
  args: {
    fieldId: v.optional(v.id("fields")),
    acknowledged: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    let query = ctx.db.query("alerts").withIndex("by_user", (q) => q.eq("userId", user._id));
    let alerts = await query.collect();

    // Filter by field if specified
    if (args.fieldId) {
      alerts = alerts.filter(alert => alert.fieldId === args.fieldId);
    }

    // Filter by acknowledgment status if specified
    if (args.acknowledged !== undefined) {
      alerts = alerts.filter(alert => 
        args.acknowledged ? alert.acknowledgedAt !== undefined : alert.acknowledgedAt === undefined
      );
    }

    return alerts.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const acknowledgeAlert = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const alert = await ctx.db.get(args.alertId);
    if (!alert || alert.userId !== user._id) {
      throw new Error("Alert not found or access denied");
    }

    await ctx.db.patch(args.alertId, {
      acknowledgedAt: Date.now(),
      acknowledgedBy: user._id,
    });
  },
});

export const getFieldAlerts = query({
  args: { fieldId: v.id("fields") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Verify field ownership
    const field = await ctx.db.get(args.fieldId);
    if (!field || field.ownerId !== user._id) {
      return [];
    }

    return await ctx.db
      .query("alerts")
      .withIndex("by_field", (q) => q.eq("fieldId", args.fieldId))
      .order("desc")
      .collect();
  },
});
