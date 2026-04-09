import { AppDataSource } from "../config/db";
import { Request, Response } from "express";
import { getFieldsQuery } from "../utils/query.helper";
import { buildGetAllQuery } from "../service/resource.service";
import { validateBody } from "../utils/checkTable";
import { logAudit } from "../service/audit.service";


export async function getAllResources(req: Request, res: Response) {
    const resource = (req as any).resource
    const { data, total, totalPage } = await buildGetAllQuery(resource, req.query);

    res.set({
        "X-Total-Count": total,
        "X-Total-Page": totalPage,
        "Access-Control-Expose-Headers": "X-Total-Count, X-Total-Page"
    });

    return res.status(200).json({ data });
}

export async function getResourceById(req: Request, res: Response) {
    const resource = (req as any).params.resource
    const id = (req as any).params.id

    const { _fields } = req.query

    const fieldsQuery = getFieldsQuery(resource, _fields);
    const qb = AppDataSource.createQueryBuilder().select(fieldsQuery).from(resource, resource).where(`id= :id`, { id });
    const data = await qb.getRawOne()
    if (!data) {
        return res.status(404).json({
            message: "Resource not found"
        });
    }
    return res.status(200).json(data);
}

export async function createResource(req: Request, res: Response) {
    const resource = (req as any).resource
    const body = req.body

    const validatedBody = validateBody(resource, body);
    if (!validatedBody) {
        return res.status(400).json({
            error: "Invalid fields"
        })
    }

    const qb = AppDataSource.createQueryBuilder().insert().into(resource).values(validatedBody)
    const data = await qb.returning("*").execute()

    let userId = null
    if (resource === 'users') {
        userId = data.raw[0]?.id || null
    }
    logAudit(resource, 'CREATE', userId, data.raw[0]?.id || null);

    return res.status(200).json({
        message: "Resource created successfully",
        data: data.raw
    });
}

export async function deleteResource(req: Request, res: Response) {
    const resource = (req as any).resource
    const id = (req as any).params.id
    await AppDataSource.createQueryBuilder().delete().from(resource).where("id = :id", { id }).execute();

    let userId = null
    if (resource === 'users') {
        userId = id
    }

    logAudit(resource, 'DELETE', userId, Number(id));

    return res.status(200).json({
        message: "Resource deleted successfully"
    });
}

export async function updateResource(req: Request, res: Response) {
    const resource = (req as any).resource
    const id = (req as any).id
    const body = req.body
    const method = req.method;

    const validatedBody = validateBody(resource, body, method);
    console.log(validatedBody)
    if (!validatedBody) {
        return res.status(400).json({
            error: "Invalid fields"
        })
    }
    await AppDataSource.createQueryBuilder().update(resource).set({
        ...validatedBody,
        updated_at: new Date()
    }).where(`id=:id`, { id }).execute()

    let userId = null
    if (resource === 'users') {
        userId = id
    }
    logAudit(resource, 'UPDATE', userId, Number(id));

    return res.status(200).json({
        message: "Resource updated successfully"
    });
}
