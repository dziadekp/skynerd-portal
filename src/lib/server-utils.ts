// Server-side utilities — reads env vars at RUNTIME (not build time)
// This is critical for Railway where API_URL is set as an env var

export function getInternalApiUrl(): string {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}
