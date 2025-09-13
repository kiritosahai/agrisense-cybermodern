/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as alerts from "../alerts.js";
import type * as analysis from "../analysis.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as fields from "../fields.js";
import type * as http from "../http.js";
import type * as images from "../images.js";
import type * as jobs from "../jobs.js";
import type * as sampleData from "../sampleData.js";
import type * as sensors from "../sensors.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  analysis: typeof analysis;
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  fields: typeof fields;
  http: typeof http;
  images: typeof images;
  jobs: typeof jobs;
  sampleData: typeof sampleData;
  sensors: typeof sensors;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
