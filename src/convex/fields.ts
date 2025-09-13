import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const createField = mutation({
  args: {
    name: v.string(),
    cropType: v.string(),
    area: v.number(),
    coordinates: v.array(v.array(v.number())),
    centerLat: v.number(),
    centerLng: v.number(),
    soilType: v.optional(v.string()),
    plantingDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    return await ctx.db.insert("fields", {
      ownerId: user._id,
      ...args,
    });
  },
});

export const getUserFields = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    return await ctx.db
      .query("fields")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
  },
});

export const getFieldById = query({
  args: { fieldId: v.id("fields") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const field = await ctx.db.get(args.fieldId);
    if (!field || field.ownerId !== user._id) {
      throw new Error("Field not found or access denied");
    }

    return field;
  },
});

export const updateField = mutation({
  args: {
    fieldId: v.id("fields"),
    name: v.optional(v.string()),
    cropType: v.optional(v.string()),
    area: v.optional(v.number()),
    soilType: v.optional(v.string()),
    plantingDate: v.optional(v.number()),
    harvestDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const field = await ctx.db.get(args.fieldId);
    if (!field || field.ownerId !== user._id) {
      throw new Error("Field not found or access denied");
    }

    const { fieldId, ...updates } = args;
    await ctx.db.patch(fieldId, updates);
  },
});
