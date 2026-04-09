import { AppDataSource } from "../config/db";
import { Brackets, In } from "typeorm";
import { areValidFields, isValidResource, parseFields } from "../utils/checkTable";
import { searchableMeta } from "../core/schema";
import { singular } from "../utils/query.helper";
import { isValidField } from "../utils/checkTable"


export async function buildGetAllQuery(resource: string, query: any) {
    const { _fields, _page, _limit, _sort, _order, q, _expand, _embed } = query;

    const qb = AppDataSource.createQueryBuilder().from(resource, resource);

    // fields
    const fields = parseFields(_fields);
    if (fields && areValidFields(resource, fields)) {
        qb.select(fields.map(f => `${resource}.${f}`));
    } else {
        qb.select(`${resource}.*`);
    }

    // search
    if (typeof q === "string" && q.trim()) {
        const searchFields = searchableMeta[resource as keyof typeof searchableMeta] ;

        if (searchFields && searchFields.length > 0) {
            qb.andWhere(new Brackets(sqb => {
                searchFields.forEach((field, i) => {
                    const key = `q${i}`;
                    const condition = `${resource}.${field} ILIKE :${key}`;

                    if (i === 0) {
                        sqb.where(condition, { [key]: `%${q}%` });
                    } else {
                        sqb.orWhere(condition, { [key]: `%${q}%` });
                    }
                });
            }));
        }
    }

    // filtering
    const filterOperators = ["_gte", "_lte", "_ne", "_like"];

    Object.keys(query).forEach((key) => {
        const value = query[key];

        const operator = filterOperators.find(op => key.endsWith(op));
        if (!operator) return;

        const field = key.replace(operator, "");

        // validate field
        if (!isValidField(resource, field)) return;

        const paramKey = `${field}${operator}`;

        switch (operator) {
            case "_gte":
                qb.andWhere(`${resource}.${field} >= :${paramKey}`, { [paramKey]: value });
                break;

            case "_lte":
                qb.andWhere(`${resource}.${field} <= :${paramKey}`, { [paramKey]: value });
                break;
            case "_ne":
                qb.andWhere(
                    `(${resource}.${field} IS NULL OR ${resource}.${field} != :${paramKey})`,
                    { [paramKey]: value }
                );
                break;

            case "_like":
                qb.andWhere(`${resource}.${field} ILIKE :${paramKey}`, { [paramKey]: `%${value}%` });
                break;
        }
    });

    // sort
    if (_sort) {
        const sortFields = parseFields(_sort);
        if (sortFields && areValidFields(resource, sortFields)) {
            qb.orderBy(`${resource}.${sortFields[0]}`, _order === "desc" ? "DESC" : "ASC");
        }
    }

    // pagination
    let totalPage = 1
    const countQb = qb.clone();
        countQb.select(`COUNT(${resource}.id)`, "count");
        countQb.orderBy();
        countQb.skip(undefined);
        countQb.take(undefined);
    const { count } = await countQb.getRawOne();
    const total = Number(count) || 0;

    if (_limit) qb.take(Number(_limit));
    if (_page && _limit) {
        const limit = Number(_limit);
        totalPage = Math.ceil(total / limit);
        qb.skip((Number(_page) - 1) * limit).take(limit);
    }

    let data = await qb.getRawMany();
    // xử lý _expand
    if (_expand && data.length > 0) {
        const embedParents = _expand.split(',').map((e: string) => e.trim());

        for (const target of embedParents) {
            if (!isValidResource(target)) continue;

            const parentTable = singular(target);
            const fk = `${parentTable}_id`;

            const parentIds = [...new Set(
                data.map((item: any) => item[fk]).filter(Boolean)
            )];

            if (parentIds.length === 0) continue;
            const parents = await AppDataSource
                                .createQueryBuilder()
                                .select(`${target}.*`)
                                .from(target, target)
                                .where(`${target}.id IN (:...ids)`, { ids: parentIds })
                                .getRawMany();
            const parentMap = new Map(parents.map((p: any) => [p.id, p]));

            data = data.map((item: any) => {
            const parent = parentMap.get(item[fk]) || null;

            if (parent) delete parent.password;

                return {
                    ...item,
                    [singular(target)]: parent
                };
            });
        }
    }

    // xử lý _embed
    if (_embed && data.length > 0) {
        const embedTargets = _embed.split(',').map((e: string) => e.trim());

        for (const target of embedTargets) {
            if (!isValidResource(target)) continue;

            const parentTable = singular(resource); // user
            const fk = `${parentTable}_id`;         // user_id

            const ids = data.map((item: any) => item.id);

            if (ids.length === 0) continue;

            const children = await AppDataSource
                .createQueryBuilder()
                .select(`${target}.*`)
                .from(target, target)
                .where(`${target}.${fk} IN (:...ids)`, { ids })
                .getRawMany();

            const childMap = new Map();

            for (const c of children as any[]) {
                if (!childMap.has(c[fk])) {
                    childMap.set(c[fk], []);
                }

                delete c.password;
                childMap.get(c[fk]).push(c);
            }

            data = data.map((item: any) => ({
                ...item,
                [target]: childMap.get(item.id) || []
            }));
        }
    }

    return {data, total, totalPage };
}