import { AppDataSource } from "../config/db";

export const logAudit = async (
    resourceName: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    userId: number | null,
    record_id: number | null
) => {
    try {
        const qb = AppDataSource.createQueryBuilder().insert().into("audit_logs").values({
            user_id: userId || null,
            action: action,
            resource_name: resourceName,
            record_id: record_id || null
        });
        await qb.execute();
    } catch (err) {
        console.error("Audit log failed:", err);
    }
};
