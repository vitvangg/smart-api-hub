import fs from "fs";
import path from "path";
import { AppDataSource } from "../config/db";

export async function runMigration() {
  const schemaPath = path.join(process.cwd(), "schema.json");
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();

  for (const table of Object.keys(schema)) {
    const exists = await qr.hasTable(table);
    if (!exists) {
      const sample = schema[table][0];

      const colsArr = [
        `id SERIAL PRIMARY KEY`,
        ...Object.entries(sample)
          .filter(([k]) => k !== "id")
          .map(([k, v]) =>
            typeof v === "number"
              ? `"${k}" INTEGER`
              : typeof v === "boolean"
                ? `"${k}" BOOLEAN`
                : `"${k}" TEXT`
          )
      ]
      if (table === "audit_logs") {
        colsArr.push(`timestamp TIMESTAMP DEFAULT NOW()`);
      } else {
        colsArr.push(`created_at TIMESTAMP DEFAULT NOW()`);
        colsArr.push(`updated_at TIMESTAMP DEFAULT NOW()`);
      }
      const cols = colsArr.join(", ");

      await qr.query(`CREATE TABLE "${table}" (${cols})`);
      console.log(`✅ Đã tạo bảng "${table}"`);
    }
  }

  await qr.release();
}

async function main() {
  try {
    console.log("🚀 Start migration...");
    await AppDataSource.initialize();
    await runMigration();
    console.log("✅ Done!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

main();