import type { LoginValues } from "./login-schema";

export type AuthUser = { username: "admin" };

export async function authenticate(values: LoginValues): Promise<AuthUser | null> {
  return values.username === "admin" && values.password === "admin123456Aa@"
    ? { username: "admin" }
    : null;
}
