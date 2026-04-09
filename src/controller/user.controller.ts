import { AppDataSource } from "../config/db";
import { Request, Response } from "express";
import { userSchema } from "../utils/checkTable";
import bcrypt from "bcryptjs";
import { logAudit } from "../service/audit.service";

export async function updateUser(req: Request, res: Response) {
    const id = (req as any).params.id;
    const userFromToken = (req as any).user;
    const method = req.method;

    if (String(userFromToken._id) !== String(id)) {
        return res.status(403).json({ message: "Unauthorized: Bạn không có quyền cập nhật!" });
    }

    const result = method === "PATCH" ? userSchema.partial().safeParse(req.body) : userSchema.safeParse(req.body);
    const validatedData = result.data;

    if (!result.success) {
        return res.status(400).json({
            error: "Invalid fields"
        });
    }

    // Kiem tra password co bi thay doi hay khong, neu co thi hash lai password
    if (validatedData && validatedData.password) {
        validatedData.password = await bcrypt.hash(validatedData.password, 10);
    }


    await AppDataSource.createQueryBuilder().update('users').set({ ...validatedData, updated_at: new Date() }).where(`id=:id`, { id }).execute()

    logAudit('users', 'UPDATE', userFromToken._id, id);

    return res.status(200).json({
        message: "Resource updated successfully"
    });
}

export async function deleteUser(req: Request, res: Response) {
    const idFromUrl = req.params.id;
    const userFromToken = (req as any).user;
    const isAdmin = userFromToken.role === 'admin';
    const isOwner = String(userFromToken._id) === String(idFromUrl);

    if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Bạn không có quyền xóa!" });
    }
    const deleteResult = await AppDataSource.createQueryBuilder().delete().from('users').where(`id=:id`, { id: idFromUrl }).execute()

    if (deleteResult.affected === 0) {
        return res.status(404).json({ message: "Resource not found" });
    }

    logAudit('users', 'DELETE', userFromToken._id, Number(idFromUrl));

    return res.status(200).json({
        message: "Resource deleted successfully"
    });
}
