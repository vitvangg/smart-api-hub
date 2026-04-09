import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    _id: number;
    email: string;
    role: string;
}

export async function auth(req: Request, res: Response, next: NextFunction) {
    try {
        // 1. Lấy token từ cookie
        const accessToken = req.cookies?.access_token;

        if (!accessToken) {
            return res.status(401).json({ message: "Bạn chưa đăng nhập! (Không tìm thấy token)" });
        }

        // 2. Xác thực token
        const secretKey = process.env.JWT_KEY;
        if (!secretKey) {
            return res.status(500).json({ message: "Lỗi cấu hình Server (Thiếu JWT_KEY)" });
        }

        const decoded = jwt.verify(accessToken, secretKey) as TokenPayload;

        (req as any).user = decoded;

        next();
    } catch (error: any) {
        return res.status(401).json({ message: "Token không hợp lệ!" });
    }
}