import { schemaMeta } from "../core/schema";
import { z } from "zod";

export const userSchema = z.object({
  email: z.email("Định dạng email không hợp lệ"),
  password: z.string(),
  role: z.enum(["admin", "user"], "Role phải là 'admin' hoặc 'user'")
});

export const loginSchema = userSchema.pick({ email: true, password: true });

// xác thực resource
export function isValidResource(resource: string): boolean {
    return Object.hasOwn(schemaMeta, resource);
}

// lấy valid fields của resource
export function getValidFields(resource: string): string[] | null {
    if (!isValidResource(resource)) return null;

    const schema = schemaMeta[resource];
    return Object.keys(schema as Record<string, any>);
}

// xác thực fields array
export function areValidFields(resource: string, fields: string[]): boolean {
    const validFields = getValidFields(resource);
    if (!validFields) return false;

    return fields.every(f => validFields.includes(f));
}

// xác thực insert body
export function validateBody(
  resource: string,
  data: Record<string, any>,
  method: string = "POST"
) {
  const schema = schemaMeta[resource];
  if (!schema) return null;

  // 🔥 check required fields (POST / PUT)
  if (method === "POST" || method === "PUT") {
    for (const key of Object.keys(schema)) {
      if (["id", "created_at", "updated_at"].includes(key)) continue;
      if (data[key] === undefined) return null;
    }
  }

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const expectedType = schema[key as keyof typeof schema];
    if (!expectedType) return null; // ❗ field không hợp lệ

    // 🔥 STRICT TYPE CHECK (không convert)
    if (expectedType === "string" && typeof value !== "string") return null;
    if (expectedType === "number" && typeof value !== "number") return null;
    if (expectedType === "boolean" && typeof value !== "boolean") return null;

    result[key] = value; // giữ nguyên
  }

  return result;
}

// parse + validate _fields / _sort
export function parseFields(raw: unknown): string[] | null {
    if (typeof raw !== "string" || !raw.trim()) return null;

    return raw.split(",").map(f => f.trim());
}

export function isValidField(resource: string, field: string): boolean {
    const validFields = getValidFields(resource);
    if (!validFields) return false;

    return validFields.includes(field);
}