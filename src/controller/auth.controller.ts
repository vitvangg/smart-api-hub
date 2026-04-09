import { Request, Response } from 'express';
import { AppDataSource } from '../config/db';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
import { userSchema, loginSchema } from '../utils/checkTable';
import { logAudit } from '../service/audit.service';


dotenv.config();

const ACCESS_TOKEN_TTL = '2d' // cho song 2 hom

export async function signUp(req: Request, res: Response) {
    const result = userSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ status: "error", errors: result.error.issues });
    }

    const { email, password, role } = result.data;

    const duplicateEmail = await AppDataSource.createQueryBuilder().select("u.id", "id").from('users', 'u').where(`u.email=:email`, { email }).getRawOne()

    if (duplicateEmail) {
        return res.status(400).json({ message: 'Email already exists' });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const rows = await AppDataSource.createQueryBuilder().insert().into('users').values(
        {
            email,
            password: hashPassword,
            role
        }
    ).execute()

    const newUser = await AppDataSource.createQueryBuilder().select([
        "u.id AS id",
        "u.email AS email",
        "u.role AS role"
    ]).from('users', 'u').where(`u.email=:email`, { email }).getRawOne()

    if (newUser) {
        logAudit('users', 'CREATE', newUser.id, newUser.id);
    }

    return res.status(201).json({
        message: 'User registered successfully',
        data: newUser
    });
}

export async function signIn(req: Request, res: Response) {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            status: "error",
            errors: result.error.issues
        });
    }

    const { email, password } = result.data;

    const qb = AppDataSource.createQueryBuilder().from('users', 'users');

    const userExists = await qb.where('users.email= :email', { email }).getRawOne()
    if (!userExists) {
        return res.status(404).json({ message: "User not found" });
    }

    // check mat khau
    const matchPassword = await bcrypt.compare(password, userExists.password)
    if (!matchPassword) {
        return res.status(401).json({ message: "Password wrong" });
    }

    // tao accesToken
    const accessToken = jwt.sign(
        {
            _id: userExists.id,
            email: userExists.email,
            role: userExists.role
        }, process.env.JWT_KEY as string, { expiresIn: ACCESS_TOKEN_TTL })

    res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 2 * 24 * 60 * 60 * 1000 // 2 ngày
    })

    return res.status(200).json({ message: `Hello ${userExists.email}` })
}