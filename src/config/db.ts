import { DataSource } from "typeorm"
import 'dotenv/config';

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    username: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    database: process.env.POSTGRES_DB || "express_typeorm",
    entities: [],
    logging: true,
    synchronize: false, // Tự động đồng bộ hóa schema, chỉ nên dùng trong development,
    migrations: [],
    subscribers: [],
    ssl: {
        rejectUnauthorized: false,
    },
})