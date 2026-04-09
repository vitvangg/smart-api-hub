import { Request, Response, NextFunction } from "express";
import { isValidResource } from "../utils/checkTable";

export async function validateResourceAndId(req: Request, res: Response, next: NextFunction) {
    const { resource, id } = req.params;
    console.log("🚀 validateResourceAndId middleware:", { resource, id });

    if (typeof resource !== "string" || !isValidResource(resource)) {
        return res.status(400).json({ message: "Invalid resource" });
    }

    if (id !== undefined && isNaN(Number(id))) {
        return res.status(400).json({ message: "ID must be a number" });
    }

    (req as any).resource = resource;
    (req as any).id = Number(id);
    next();
}