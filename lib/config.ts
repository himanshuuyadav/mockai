import "server-only";

const serverEnvKeys = [
  "NODE_ENV",
  "MONGODB_URI",
  "MONGODB_DB_NAME",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "GEMINI_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_PRO_PRICE_ID",
  "STRIPE_WEBHOOK_SECRET",
  "BILLING_BOOTSTRAP_TOKEN",
] as const;

export type ServerEnvKey = (typeof serverEnvKeys)[number];
type RuntimeEnv = "development" | "production" | "test";

const requiredInAllEnvironments: ReadonlyArray<ServerEnvKey> = [
  "MONGODB_URI",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NEXTAUTH_SECRET",
  "GEMINI_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const requiredInProductionOnly: ReadonlyArray<ServerEnvKey> = [
  "NEXTAUTH_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_PRO_PRICE_ID",
  "STRIPE_WEBHOOK_SECRET",
];

const envStore: Record<ServerEnvKey, string | undefined> = {
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  BILLING_BOOTSTRAP_TOKEN: process.env.BILLING_BOOTSTRAP_TOKEN,
};

function normalizeRuntimeEnv(input: string | undefined): RuntimeEnv {
  if (input === "production" || input === "test") {
    return input;
  }
  return "development";
}

const runtimeEnv = normalizeRuntimeEnv(envStore.NODE_ENV);

export const config = Object.freeze({
  env: runtimeEnv,
  isDevelopment: runtimeEnv === "development",
  isProduction: runtimeEnv === "production",
  isTest: runtimeEnv === "test",
  app: {
    name: "MockAI",
    baseUrl: envStore.NEXTAUTH_URL ?? "http://localhost:3000",
  },
});

function getRequiredEnvKeysForRuntime(env: RuntimeEnv) {
  return env === "production"
    ? [...requiredInAllEnvironments, ...requiredInProductionOnly]
    : [...requiredInAllEnvironments];
}

function buildMissingEnvError(missingKeys: string[], env: RuntimeEnv) {
  const target =
    env === "production"
      ? "deployment environment variables"
      : "your .env.local file";

  return new Error(
    [
      "[ConfigError] Missing required environment variables.",
      `Environment: ${env}`,
      `Missing: ${missingKeys.join(", ")}`,
      `Action: Add these variables to ${target} and restart the server.`,
    ].join("\n"),
  );
}

export function getRequiredServerEnv(key: ServerEnvKey): string {
  const value = envStore[key];
  if (!value) {
    throw buildMissingEnvError([key], runtimeEnv);
  }
  return value;
}

export function getOptionalServerEnv(key: string): string | undefined {
  return process.env[key];
}

let isValidated = false;

export function validateConfigOnStartup(): void {
  if (isValidated) {
    return;
  }

  const requiredKeys = getRequiredEnvKeysForRuntime(runtimeEnv);
  const missing = requiredKeys.filter((key) => !envStore[key]);

  if (missing.length > 0) {
    throw buildMissingEnvError(missing, runtimeEnv);
  }

  isValidated = true;
}

export const publicConfig = Object.freeze({
  appName: config.app.name,
  env: config.env,
});
