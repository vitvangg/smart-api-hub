import express from "express"
import cookieParser from 'cookie-parser'
import { AppDataSource } from "./config/db"
import routerResource from "./routers/resource.route"
import routerAuth from "./routers/auth.route";
import routerUser from "./routers/user.route";
import { logger } from "./middleware/logger";
import { globalErrorHandler } from "./middleware/error.middleware";
import 'dotenv/config';
import { rateLimiterMiddleware } from "./middleware/rate_limit.middleware";
import swaggerUi from "swagger-ui-express";
import fs from "fs";

// create and setup express app
export const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(logger);

// Rate Limiting Middleware - Giới hạn số lượng request từ một IP trong một khoảng thời gian nhất định
app.use(rateLimiterMiddleware);

// Swagger UI setup
const swaggerDocument = JSON.parse(fs.readFileSync("src/swagger.json", "utf-8"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/health", async (req, res) => {
    try {
        if (!AppDataSource.isInitialized) throw new Error("DB not initialized");
        await AppDataSource.query("SELECT 1");

        res.status(200).json({
            status: "healthy",
            database: "connected",
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        res.status(500).json({
            status: "unhealthy",
            database: "disconnected",
            error: error.message
        });
    }
});


app.use('/auth', routerAuth);
app.use('/users', routerUser);
app.use('/api', routerResource);

app.use(globalErrorHandler);

async function start() {
    try {
        await AppDataSource.initialize();
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`);
        });
    } catch (err) {
        console.error("❌ Startup failed:", err);
        process.exit(1);
    }
}

start()

