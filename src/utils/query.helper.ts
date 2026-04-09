import { schemaMeta, searchableMeta } from "../core/schema";

export function getFieldsQuery(resource: string, fieldsRaw: any): string {
    if (!(resource in schemaMeta)) return "*";

    if (typeof fieldsRaw !== "string" || !fieldsRaw.trim()) {
        return "*";
    }

    const validFields = schemaMeta[resource as keyof typeof schemaMeta];
    
    const selectedFields = fieldsRaw
        .split(",")
        .map(f => f.trim())
        .filter(f => (validFields as Record<string, any>).includes(f));

    return selectedFields.length > 0 
        ? selectedFields.map(f => `"${f}"`).join(", ") 
        : "*";
}

export function singular(table: string) {
    return table.endsWith("s") ? table.slice(0, -1) : table;
}
