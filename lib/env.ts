import "server-only";

import {
  getOptionalServerEnv,
  getRequiredServerEnv,
  validateConfigOnStartup,
  type ServerEnvKey,
} from "@/lib/config";

export type RequiredServerEnvKey = ServerEnvKey;

export function getRequiredEnv(key: RequiredServerEnvKey): string {
  return getRequiredServerEnv(key);
}

export function getEnv(key: string): string | undefined {
  return getOptionalServerEnv(key);
}

export function validateServerEnv(): void {
  validateConfigOnStartup();
}
