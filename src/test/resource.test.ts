import request from "supertest";
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { app } from "../index";
import { AppDataSource } from "../config/db";

describe("Resource API", () => {

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
    await AppDataSource.query(`TRUNCATE TABLE posts RESTART IDENTITY CASCADE`);
  });

  // =========================
  // CREATE
  // =========================

  it("POST /api/users - create success", async () => {
    const res = await request(app).post("/api/users").send({
      email: "test@gmail.com",
      password: "123",
      role: "user"
    });

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toHaveProperty("id");
  });

  it("POST /api/users - invalid fields (400)", async () => {
    const res = await request(app).post("/api/users").send({
      email: 123
    });

    expect(res.status).toBe(400); 
  });

  // =========================
  // GET ALL
  // =========================

  it("GET /api/users - get list", async () => {
    await request(app).post("/api/users").send({
        email: "a@gmail.com",
        password: "123",
        role: "user"
    });

    const res = await request(app).get("/api/users");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/users?_fields=email - select fields", async () => {
    await request(app).post("/api/users").send({
      email: "a@gmail.com",
      password: "123",
        role: "user"
    });

    const res = await request(app).get("/api/users?_fields=email");

    expect(res.body.data[0]).toHaveProperty("email");
  });

  // =========================
  // SEARCH
  // =========================

  it("GET /api/users?q=a@gmail.com - search", async () => {
    await request(app).post("/api/users").send({
      email: "search@gmail.com",
      password: "123",
        role: "user"
    });

    const res = await request(app).get("/api/users?q=search");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  // =========================
  // PAGINATION
  // =========================

  it("GET /api/users?_page=1&_limit=1", async () => {
    await request(app).post("/api/users").send({ email: "a@gmail.com", password: "123", role: "user" });
    await request(app).post("/api/users").send({ email: "b@gmail.com", password: "123", role: "user" });

    const res = await request(app).get("/api/users?_page=1&_limit=1");

    expect(res.headers["x-total-count"]).toBeDefined();
    expect(res.headers["x-total-page"]).toBeDefined();
  });

  // =========================
  // GET BY ID
  // =========================

  it("GET /api/users/:id - success", async () => {
    const create = await request(app).post("/api/users").send({
      email: "get@gmail.com",
      password: "123",
      role: "user"
    });

    const id = create.body.data[0].id;

    const res = await request(app).get(`/api/users/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });

  it("GET /api/users/9999 - not found (edge)", async () => {
    const res = await request(app).get("/api/users/9999");

    expect(res.status).toBe(404);
  });

  // =========================
  // UPDATE
  // =========================

  it("PATCH /api/users/:id - update success", async () => {
    const create = await request(app).post("/api/users").send({
      email: "old@gmail.com",
      password: "123",
      role: "user"
    });

    const id = create.body.data[0].id;

    const res = await request(app)
      .patch(`/api/users/${id}`)
      .send({ email: "new@gmail.com" });

    expect(res.status).toBe(200);
  });

  it("PATCH /api/users/:id - invalid fields", async () => {
    const create = await request(app).post("/api/users").send({
      email: "old@gmail.com",
      password: "123",
        role: "user"
    });

    const id = create.body.data[0].id;

    const res = await request(app)
      .patch(`/api/users/${id}`)
      .send({ email: 123 });

    expect(res.status).toBe(400);
  });

  // =========================
  // DELETE
  // =========================

  it("DELETE /api/users/:id - success", async () => {
    const create = await request(app).post("/api/users").send({
      email: "delete@gmail.com",
      password: "123",
      role: "user"
    });

    const id = create.body.data[0].id;

    const res = await request(app).delete(`/api/users/${id}`);

    expect(res.status).toBe(200);
  });

  // =========================
  // EXPAND
  // =========================

  it("GET /api/posts?_expand=users", async () => {
    const user = await request(app).post("/api/users").send({
      email: "expand@gmail.com",
      password: "123",
      role: "user"
    });

    const userId = user.body.data[0].id;

    await request(app).post("/api/posts").send({
      title: "post 1",
      content: "content 1",
      user_id: userId
    });

    const res = await request(app).get("/api/posts?_expand=users");

    expect(res.body.data[0]).toHaveProperty("user");
  });

  // =========================
  // EMBED
  // =========================

  it("GET /api/users?_embed=posts", async () => {
    const user = await request(app).post("/api/users").send({
      email: "embed@gmail.com",
      password: "123",
      role: "user"
    });

    const userId = user.body.data[0].id;

    await request(app).post("/api/posts").send({
      title: "post 1",
        content: "content 1",
      user_id: userId
    });

    const res = await request(app).get("/api/users?_embed=posts");

    expect(Array.isArray(res.body.data[0].posts)).toBe(true);
  });

});