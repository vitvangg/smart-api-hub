import { Request, Response, NextFunction } from "express";

export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.log("🔥 Đã vào Error Handler!");
    console.error(err);
    res.status(err.status || 500).json({
        error: err.message || "Internal server error"
    });
}