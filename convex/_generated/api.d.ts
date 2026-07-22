/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as favorites from "../favorites.js";
import type * as fedapay from "../fedapay.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as lib from "../lib.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as portfolio from "../portfolio.js";
import type * as profiles from "../profiles.js";
import type * as reports from "../reports.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as seedDemo from "../seedDemo.js";
import type * as services from "../services.js";
import type * as settings from "../settings.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";
import type * as verification from "../verification.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  categories: typeof categories;
  favorites: typeof favorites;
  fedapay: typeof fedapay;
  files: typeof files;
  http: typeof http;
  lib: typeof lib;
  messages: typeof messages;
  notifications: typeof notifications;
  orders: typeof orders;
  payments: typeof payments;
  portfolio: typeof portfolio;
  profiles: typeof profiles;
  reports: typeof reports;
  reviews: typeof reviews;
  seed: typeof seed;
  seedDemo: typeof seedDemo;
  services: typeof services;
  settings: typeof settings;
  subscriptions: typeof subscriptions;
  users: typeof users;
  verification: typeof verification;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
