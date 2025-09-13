import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const createProcessingJob = mutation({
  args: {
    fieldId: v.optional(v.id("fields")),
    imageId: v.optional(v.id("images")),
    jobType: v.union(
      v.literal("image_processing"),
      v.literal("index_calculation"),
      v.literal("ml_inference"),
      v.literal("report_generation")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    return await ctx.db.insert("processingJobs", {
      ...args,
      userId: user._id,
      status: "pending",
      progress: 0,
      startedAt: Date.now(),
    });
  },
});

export const updateJobProgress = mutation({
  args: {
    jobId: v.id("processingJobs"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),
    progress: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    resultS3Key: v.optional(v.string()),
    logs: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { jobId, ...updates } = args;
    
    const patchData: any = { ...updates };
    if (updates.status === "completed" || updates.status === "failed") {
      patchData.completedAt = Date.now();
    }

    await ctx.db.patch(jobId, patchData);
  },
});

export const getUserJobs = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    let query = ctx.db.query("processingJobs").withIndex("by_user", (q) => q.eq("userId", user._id));
    let jobs = await query.collect();

    if (args.status) {
      jobs = jobs.filter(job => job.status === args.status);
    }

    return jobs.sort((a, b) => b.startedAt - a.startedAt);
  },
});

export const getJobById = query({
  args: { jobId: v.id("processingJobs") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== user._id) {
      return null;
    }

    return job;
  },
});
