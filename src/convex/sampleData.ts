import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

export const createSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Create sample fields
    const field1 = await ctx.db.insert("fields", {
      ownerId: user._id,
      name: "North Field",
      cropType: "Corn",
      area: 25.5,
      coordinates: [
        [-122.4194, 37.7749],
        [-122.4094, 37.7749],
        [-122.4094, 37.7849],
        [-122.4194, 37.7849],
        [-122.4194, 37.7749]
      ],
      centerLat: 37.7799,
      centerLng: -122.4144,
      soilType: "Loamy",
      plantingDate: Date.now() - (90 * 24 * 60 * 60 * 1000), // 90 days ago
    });

    const field2 = await ctx.db.insert("fields", {
      ownerId: user._id,
      name: "South Field",
      cropType: "Wheat",
      area: 18.2,
      coordinates: [
        [-122.4294, 37.7649],
        [-122.4194, 37.7649],
        [-122.4194, 37.7749],
        [-122.4294, 37.7749],
        [-122.4294, 37.7649]
      ],
      centerLat: 37.7699,
      centerLng: -122.4244,
      soilType: "Clay",
      plantingDate: Date.now() - (75 * 24 * 60 * 60 * 1000), // 75 days ago
    });

    // Create sample sensor readings for the last 30 days
    const sensorTypes = ["soil_moisture", "air_temperature", "humidity", "leaf_wetness"];
    const fields = [field1, field2];
    
    for (const fieldId of fields) {
      for (let day = 0; day < 30; day++) {
        const timestamp = Date.now() - (day * 24 * 60 * 60 * 1000);
        
        for (const sensorType of sensorTypes) {
          let value, unit;
          
          switch (sensorType) {
            case "soil_moisture":
              value = 45 + Math.random() * 30; // 45-75%
              unit = "%";
              break;
            case "air_temperature":
              value = 18 + Math.random() * 15; // 18-33°C
              unit = "°C";
              break;
            case "humidity":
              value = 40 + Math.random() * 40; // 40-80%
              unit = "%";
              break;
            case "leaf_wetness":
              value = Math.random() * 100; // 0-100%
              unit = "%";
              break;
            default:
              value = 0;
              unit = "";
          }

          await ctx.db.insert("sensorReadings", {
            fieldId,
            sensorId: `sensor_${sensorType}_${fieldId}`,
            sensorType: sensorType as any,
            value: Math.round(value * 100) / 100,
            unit,
            timestamp,
          });
        }
      }
    }

    // Create sample alerts
    await ctx.db.insert("alerts", {
      fieldId: field1,
      userId: user._id,
      severity: "medium" as any,
      type: "irrigation_needed" as any,
      title: "Irrigation Recommended",
      description: "Soil moisture levels have dropped below optimal range in the north section of the field.",
      coordinates: {
        lat: 37.7799,
        lng: -122.4144,
      },
      metadata: {
        confidence: 0.85,
        affectedArea: 2.5,
      },
    });

    await ctx.db.insert("alerts", {
      fieldId: field2,
      userId: user._id,
      severity: "high" as any,
      type: "pest_risk" as any,
      title: "Pest Activity Detected",
      description: "Increased pest activity detected in wheat field. Consider applying targeted treatment.",
      coordinates: {
        lat: 37.7699,
        lng: -122.4244,
      },
      metadata: {
        confidence: 0.92,
        affectedArea: 1.8,
      },
    });

    // Create sample processing job
    await ctx.db.insert("processingJobs", {
      userId: user._id,
      fieldId: field1,
      jobType: "index_calculation" as any,
      status: "completed" as any,
      progress: 100,
      startedAt: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
      completedAt: Date.now() - (1 * 60 * 60 * 1000), // 1 hour ago
      logs: [
        "Starting NDVI calculation...",
        "Processing hyperspectral data...",
        "Calculating vegetation indices...",
        "NDVI calculation completed successfully"
      ],
    });

    return {
      message: "Sample data created successfully",
      fieldsCreated: 2,
      sensorReadingsCreated: sensorTypes.length * fields.length * 30,
      alertsCreated: 2,
      jobsCreated: 1,
    };
  },
});
