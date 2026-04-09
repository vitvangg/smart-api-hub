import fs from "fs";
import path from "path";

const rawSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../schema.json"), "utf-8")
);

type FieldType = "string" | "number" | "boolean" | "object";

const schemaMeta: Record<string, Record<string, FieldType>> = {};
const searchableMeta: Record<string, string[]> = {};

for (const [tableName, rows] of Object.entries(rawSchema)) {
  const sample = (Array.isArray(rows) && rows.length > 0) ? rows[0] : {};

  const fieldTypes: Record<string, FieldType> = {};

  for (const [key, value] of Object.entries(sample)) {
    fieldTypes[key] = typeof value as FieldType;
  }

  schemaMeta[tableName] = fieldTypes;

  searchableMeta[tableName] = Object.entries(sample)
    .filter(([key, value]) =>
      typeof value === "string" && !key.toLowerCase().endsWith("id")
    )
    .map(([key]) => key);
}


export { schemaMeta, searchableMeta }