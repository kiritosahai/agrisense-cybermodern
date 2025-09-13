import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  FARMER: "farmer",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.FARMER),
);
export type Role = Infer<typeof roleValidator>;

// Alert severity levels
export const ALERT_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export const alertSeverityValidator = v.union(
  v.literal(ALERT_SEVERITY.LOW),
  v.literal(ALERT_SEVERITY.MEDIUM),
  v.literal(ALERT_SEVERITY.HIGH),
  v.literal(ALERT_SEVERITY.CRITICAL),
);

// Processing job status
export const JOB_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const jobStatusValidator = v.union(
  v.literal(JOB_STATUS.PENDING),
  v.literal(JOB_STATUS.PROCESSING),
  v.literal(JOB_STATUS.COMPLETED),
  v.literal(JOB_STATUS.FAILED),
);

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
      farmName: v.optional(v.string()),
      location: v.optional(v.string()),
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Farm fields management
    fields: defineTable({
      ownerId: v.id("users"),
      name: v.string(),
      cropType: v.string(),
      area: v.number(), // in hectares
      coordinates: v.array(v.array(v.number())), // polygon coordinates [lng, lat]
      centerLat: v.number(),
      centerLng: v.number(),
      soilType: v.optional(v.string()),
      plantingDate: v.optional(v.number()),
      harvestDate: v.optional(v.number()),
    }).index("by_owner", ["ownerId"]),

    // Hyperspectral and multispectral images
    images: defineTable({
      fieldId: v.id("fields"),
      uploadedBy: v.id("users"),
      filename: v.string(),
      s3Key: v.string(),
      fileSize: v.number(),
      captureDate: v.number(),
      processingStatus: jobStatusValidator,
      metadata: v.object({
        bands: v.optional(v.number()),
        resolution: v.optional(v.string()),
        crs: v.optional(v.string()),
        bbox: v.optional(v.array(v.number())),
      }),
      indices: v.optional(v.object({
        ndvi: v.optional(v.number()),
        evi: v.optional(v.number()),
        savi: v.optional(v.number()),
      })),
    }).index("by_field", ["fieldId"])
      .index("by_field_and_date", ["fieldId", "captureDate"]),

    // Sensor readings (IoT data)
    sensorReadings: defineTable({
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
      timestamp: v.number(),
      location: v.optional(v.object({
        lat: v.number(),
        lng: v.number(),
      })),
    }).index("by_field_and_type", ["fieldId", "sensorType"])
      .index("by_field_and_timestamp", ["fieldId", "timestamp"]),

    // ML Models and versions
    models: defineTable({
      name: v.string(),
      version: v.string(),
      modelType: v.union(
        v.literal("ndvi_prediction"),
        v.literal("pest_detection"),
        v.literal("disease_classification"),
        v.literal("yield_prediction")
      ),
      s3ArtifactKey: v.string(),
      accuracy: v.optional(v.number()),
      metrics: v.optional(v.object({
        precision: v.optional(v.number()),
        recall: v.optional(v.number()),
        f1Score: v.optional(v.number()),
      })),
      isActive: v.boolean(),
    }).index("by_type_and_active", ["modelType", "isActive"]),

    // Alerts and notifications
    alerts: defineTable({
      fieldId: v.id("fields"),
      userId: v.id("users"),
      severity: alertSeverityValidator,
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
      acknowledgedAt: v.optional(v.number()),
      acknowledgedBy: v.optional(v.id("users")),
      metadata: v.optional(v.object({
        confidence: v.optional(v.number()),
        affectedArea: v.optional(v.number()),
      })),
    }).index("by_field", ["fieldId"])
      .index("by_user", ["userId"])
      .index("by_severity", ["severity"]),

    // Processing jobs
    processingJobs: defineTable({
      userId: v.id("users"),
      fieldId: v.optional(v.id("fields")),
      imageId: v.optional(v.id("images")),
      jobType: v.union(
        v.literal("image_processing"),
        v.literal("index_calculation"),
        v.literal("ml_inference"),
        v.literal("report_generation")
      ),
      status: jobStatusValidator,
      progress: v.number(), // 0-100
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
      errorMessage: v.optional(v.string()),
      resultS3Key: v.optional(v.string()),
      logs: v.optional(v.array(v.string())),
    }).index("by_user", ["userId"])
      .index("by_status", ["status"]),

    // Generated reports
    reports: defineTable({
      userId: v.id("users"),
      fieldId: v.id("fields"),
      title: v.string(),
      reportType: v.union(
        v.literal("field_health"),
        v.literal("yield_prediction"),
        v.literal("pest_analysis"),
        v.literal("irrigation_report")
      ),
      dateRange: v.object({
        start: v.number(),
        end: v.number(),
      }),
      s3Key: v.string(),
      format: v.union(v.literal("pdf"), v.literal("csv")),
      generatedAt: v.number(),
    }).index("by_user", ["userId"])
      .index("by_field", ["fieldId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;