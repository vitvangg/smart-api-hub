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
      const dataArray = schema[table];
      const sample = dataArray[0];

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
      ];

      if (table === "audit_logs") {
        colsArr.push(`timestamp TIMESTAMP DEFAULT NOW()`);
      } else {
        colsArr.push(`created_at TIMESTAMP DEFAULT NOW()`);
        colsArr.push(`updated_at TIMESTAMP DEFAULT NOW()`);
      }
      const cols = colsArr.join(", ");

      await qr.query(`CREATE TABLE "${table}" (${cols})`);
      console.log(`✅ Đã tạo bảng "${table}"`);

      if (dataArray && dataArray.length > 0) {
        for (const row of dataArray) {
          const keys = Object.keys(row);
          const values = Object.values(row);

          // Tạo chuỗi cột: "id", "title", "content"...
          const columnsStr = keys.map((k) => `"${k}"`).join(", ");
          
          // Tạo chuỗi tham số cho PostgreSQL: $1, $2, $3...
          const placeholdersStr = keys.map((_, i) => `$${i + 1}`).join(", ");

          const insertQuery = `INSERT INTO "${table}" (${columnsStr}) VALUES (${placeholdersStr})`;
          
          // Truyền values mảng vào để TypeORM tự động map với $1, $2...
          await qr.query(insertQuery, values);
        }
        console.log(`   ➔ Đã thêm ${dataArray.length} bản ghi vào bảng "${table}"`);

        if (sample.hasOwnProperty("id")) {
          try {
            await qr.query(
              `SELECT setval('"${table}_id_seq"', (SELECT MAX(id) FROM "${table}"))`
            );
          } catch (seqErr) {
            console.log(`   ⚠ Không thể reset sequence cho bảng ${table}`);
          }
        }
      }
    }
  }

  await qr.release();
}

async function main() {
  try {
    console.log("🚀 Start migration & seeding...");
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