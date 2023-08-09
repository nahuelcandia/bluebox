import request from "supertest";
import { blueboxInboundApp } from "./inbound";

describe("Inbound request handler", () => {
  beforeAll(() => {
    process.env.X_ORIGIN_VERIFY = "bananas";
  });

  it("must mask the sensitive data in the request", async () => {
    const payload = {
      name: "Diego Armando",
      card_number: "4222-2333-4343-1234",
      cvv: "232",
    };

    const { body: mirrorResponse } = await request(blueboxInboundApp)
      .post("/")
      .set("Accept", "application/json")
      .set("x-origin-verify", "some-secret")
      .send(payload)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(mirrorResponse.body.card_number).toMatch(/422223bx_.*_bx1234/);
    expect(mirrorResponse.body.cvv).toMatch(/bx_.*_bx/);
    expect(mirrorResponse.body.name).toEqual("Diego Armando");
  });

  it("must mask the sensitive data in the headers", async () => {
    const payload = {
      foo: "bar",
      bar: "foo",
    };

    const { body: mirrorResponse } = await request(blueboxInboundApp)
      .post("/?whatisthis=1")
      .set("Accept", "application/json")
      .set("x-origin-verify", "some-secret")
      .set("cardNumber", "1234-4321-5678-8765")
      .set("cvv", "893")
      .send(payload)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(mirrorResponse.headers.cardnumber).toMatch(/123443bx_.*_bx8765/);
    expect(mirrorResponse.headers.cvv).toMatch(/bx_.*_bx/);
    expect(mirrorResponse.body).toEqual({
      foo: "bar",
      bar: "foo",
    });
  });

  it("must mask the sensitive data in the query", async () => {
    const payload = {
      foo: "bar",
      bar: "foo",
    };

    const { body: mirrorResponse } = await request(blueboxInboundApp)
      .post("/?cardNumber=1234123412341234")
      .set("Accept", "application/json")
      .set("x-origin-verify", "some-secret")
      .send(payload)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(mirrorResponse.query.cardNumber).toMatch(/123412bx_.*_bx1234/);
    expect(mirrorResponse.body).toEqual({
      foo: "bar",
      bar: "foo",
    });
  });

  it("must return the status code of the underlying service", async () => {
    await request(blueboxInboundApp)
      .get("/badrequest")
      .set("x-origin-verify", "some-secret")
      .expect(400);

    await request(blueboxInboundApp)
      .get("/unauthorized")
      .set("x-origin-verify", "some-secret")
      .expect(401);

    await request(blueboxInboundApp)
      .get("/accepted")
      .set("x-origin-verify", "some-secret")
      .expect(201);
  });

  it("must return the payload from the underlying service even if it is an error response", async () => {
    const payload = {
      foo: "bar",
      bar: "foo",
    };

    const { body: mirrorResponse } = await request(blueboxInboundApp)
      .post("/unauthorized")
      .set("Accept", "application/json")
      .set("x-origin-verify", "some-secret")
      .send(payload)
      .expect("Content-Type", /json/)
      .expect(401);

    expect(mirrorResponse).toEqual({
      foo: "bar",
      bar: "foo",
    });
  });
});
