import request from "supertest";
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { app } from "../index";
import { AppDataSource } from "../config/db";

describe("Auth System API", () => {
  const mockUser = {
    email: "test@example.com",
    password: "123456",
    role: "admin"
  };

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
  beforeEach(async () => {
    await AppDataSource.query(`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);
  });

  describe("POST /auth/sign-up", () => {
    it("Đăng ký người dùng mới thành công", async () => {
      const res = await request(app).post("/auth/sign-up").send(mockUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("email", mockUser.email);
    });

    it("không nên cho phép đăng ký trùng email", async () => {
      await request(app).post("/auth/sign-up").send(mockUser);
      const res = await request(app).post("/auth/sign-up").send(mockUser);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email already exists");
    });

    it("nên báo lỗi nếu dữ liệu không hợp lệ (Zod validation)", async () => {
      const res = await request(app)
        .post("/auth/sign-up")
        .send({ email: "not-an-email", password: "" });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body).toHaveProperty("errors");
    });
  });

  describe("POST /auth/sign-in", () => {
    beforeEach(async () => {
      await request(app).post("/auth/sign-up").send(mockUser);
    });

    it("nên đăng nhập thành công và nhận được cookie", async () => {
      const res = await request(app).post("/auth/sign-in").send({
        email: mockUser.email,
        password: mockUser.password
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain(`Hello ${mockUser.email}`);

      const cookies = res.get("Set-Cookie")?.join("");
      expect(cookies).toContain("access_token");
      expect(cookies).toContain("HttpOnly");
    });

    it("nên từ chối nếu sai mật khẩu", async () => {
      const res = await request(app).post("/auth/sign-in").send({
        email: mockUser.email,
        password: "wrongpassword"
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Password wrong");
    });

    it("nên từ chối nếu user không tồn tại", async () => {
      const res = await request(app).post("/auth/sign-in").send({
        email: "nonexistent@example.com",
        password: "anypassword"
      });

      expect(res.status).toBe(404);
    });
  });
});