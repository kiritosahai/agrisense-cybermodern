import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const addSensorReading = mutation({
  args: {
    fieldId: v.id("fields"),
    sensorId: v.string(),
    sensorType: v.union(
      v.literal("soil_moisture"),
      v.literal("air_temperature"),
      v.literal("humidity"),
      v.literal("leaf_wetness"),
      v.literal("ph"),
      v.literal("light_intensity")
    ),
    value: v.number(),
    unit: v.string(),
    timestamp: v.optional(v.number()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
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

    return await ctx.db.insert("sensorReadings", {
      ...args,
      timestamp: args.timestamp || Date.now(),
    });
  },
});

export const getFieldSensorData = query({
  args: {
    fieldId: v.id("fields"),
    sensorType: v.optional(v.union(
      v.literal("soil_moisture"),
      v.literal("air_temperature"),
      v.literal("humidity"),
      v.literal("leaf_wetness"),
      v.literal("ph"),
      v.literal("light_intensity")
    )),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
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

    let results;
    
    if (args.sensorType !== undefined) {
      const sensorType = args.sensorType;
      results = await ctx.db
        .query("sensorReadings")
        .withIndex("by_field_and_type", (q) =>
          q.eq("fieldId", args.fieldId).eq("sensorType", sensorType)
        )
        .collect();
    } else {
      results = await ctx.db
        .query("sensorReadings")
        .withIndex("by_field_and_timestamp", (q) =>
          q.eq("fieldId", args.fieldId)
        )
        .collect();
    }

    // Filter by time range if provided
    if (args.startTime || args.endTime) {
      results = results.filter(reading => {
        if (args.startTime && reading.timestamp < args.startTime) return false;
        if (args.endTime && reading.timestamp > args.endTime) return false;
        return true;
      });
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  },
});

export const getLatestSensorReadings = query({
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

    const readings = await ctx.db
      .query("sensorReadings")
      .withIndex("by_field_and_timestamp", (q) => q.eq("fieldId", args.fieldId))
      .order("desc")
      .take(100);

    // Get the latest reading for each sensor type
    const latestReadings = new Map();
    readings.forEach(reading => {
      if (!latestReadings.has(reading.sensorType)) {
        latestReadings.set(reading.sensorType, reading);
      }
    });

    return Array.from(latestReadings.values());
  },
});
