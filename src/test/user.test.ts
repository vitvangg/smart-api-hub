import request from "supertest";
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { app } from "../index";
import { AppDataSource } from "../config/db";


process.env.NODE_ENV = "test";
process.env.JWT_KEY = "test_secret";
describe("User API", () => {
  let users: any[] = [];
  let admin: any;

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

    const mockUsers = [
      { email: "admin@gmail.com", password: "123456", role: "admin" },
      { email: "user1@gmail.com", password: "123456", role: "user" },
      { email: "user2@gmail.com", password: "123456", role: "user" },
      { email: "user3@gmail.com", password: "123456", role: "user" },
      { email: "user4@gmail.com", password: "123456", role: "user" }
    ];

    for (const u of mockUsers) {
      await request(app).post("/auth/sign-up").send(u);
    }

    const allUsers = await AppDataSource.createQueryBuilder().from('users', 'u').select([
      "u.id AS id",
      "u.email AS email",
      "u.role AS role"
    ]).getRawMany();

    admin = allUsers.find((u: any) => u.role === "admin");
    users = allUsers.filter((u: any) => u.role === "user");
  });

  // helper login
  async function loginAs(email: string) {
    const agent = request.agent(app);

    await agent.post("/auth/sign-in").send({
      email,
      password: "123456"
    });

    return agent;
  }

  // ========================= UPDATE =========================
  describe("PATCH /auth/users/:id", () => {
    it("❌ không cho phép user update người khác", async () => {
      const userA = users[0];
      const userB = users[1];

      const agent = await loginAs(userA.email);

      const res = await agent
        .patch(`/auth/users/${userB.id}`)
        .send({ email: "hack@gmail.com" });

      expect(res.status).toBe(403);
    });

    it("✅ cho phép user update chính mình", async () => {
      const user = users[0];

      const agent = await loginAs(user.email);

      const res = await agent
        .patch(`/users/${user.id}`)
        .send({ email: "updated@gmail.com" });

      expect(res.status).toBe(200);
    });
  });

  // ========================= DELETE =========================
  describe("DELETE /auth/users/:id", () => {
    it("❌ user không được xóa người khác", async () => {
      const userA = users[0];
      const userB = users[1];

      const agent = await loginAs(userA.email);

      const res = await agent.delete(`/auth/users/${userB.id}`);

      expect(res.status).toBe(403);
    });

    it("✅ user có thể tự xóa chính mình", async () => {
      const user = users[0];

      const agent = await loginAs(user.email);

      const res = await agent.delete(`/auth/users/${user.id}`);

      expect(res.status).toBe(200);
    });

    it("✅ admin có thể xóa user khác", async () => {
      const user = users[0];

      const agent = await loginAs(admin.email);

      const res = await agent.delete(`/auth/users/${user.id}`);

      expect(res.status).toBe(200);
    });

    it("❌ trả về 404 nếu xóa user không tồn tại", async () => {
      const agent = await loginAs(admin.email);

      const res = await agent.delete(`/auth/users/9999`);

      expect(res.status).toBe(404);
    });
  });
});