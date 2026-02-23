const requiredServerEnv = [
  "MONGODB_URI",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "OPENAI_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

type RequiredServerEnvKey = (typeof requiredServerEnv)[number];

export function getRequiredEnv(key: RequiredServerEnvKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getEnv(key: string): string | undefined {
  return process.env[key];
}

export function validateServerEnv(): void {
  requiredServerEnv.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });
}
