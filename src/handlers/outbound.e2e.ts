import request from "supertest";
import { blueboxInboundApp } from "./inbound";
import { blueboxOutboundApp } from "./outbound";

describe("Outbound request handler", () => {
  it("must unmask the sensitive data in the request", async () => {
    const payload = {
      name: "Diego Armando",
      card_number: "4222-2333-4343-1234",
      cvv: "232",
    };

    const { body: mirrorResponse } = await request(blueboxInboundApp)
      .post("/")
      .set("Accept", "application/json")
      .send(payload)
      .expect(200);

    const { body: unmaskedResponse } = await request(blueboxOutboundApp)
      .post("/")
      .set("Accept", "application/json")
      .set("x-bluebox-target", "http://mirror:9000")
      .send(mirrorResponse.body)
      .expect(200);

    expect(unmaskedResponse.body.name).toEqual("Diego Armando");
    expect(unmaskedResponse.body.card_number).toBe("4222233343431234");
    expect(unmaskedResponse.body.cvv).toBe("232");
  });

  it("must unmask the sensitive data in the headers", async () => {
    const payload = {
      foo: "bar",
      bar: "foo",
    };

    const { body: mirrorResponse } = await request(blueboxInboundApp)
      .post("/")
      .set("Accept", "application/json")
      .set("cardNumber", "1234-4321-5678-8765")
      .set("cvv", "893")
      .send(payload)
      .expect("Content-Type", /json/)
      .expect(200);

    const { body: unmaskedResponse } = await request(blueboxOutboundApp)
      .post("/")
      .set("Accept", "application/json")
      .set("cardNumber", mirrorResponse.headers["cardnumber"])
      .set("cvv", mirrorResponse.headers["cvv"])
      .set("x-bluebox-target", "http://mirror:9000")
      .send(mirrorResponse.body)
      .expect(200);

    expect(unmaskedResponse.body).toEqual({
      foo: "bar",
      bar: "foo",
    });
    expect(unmaskedResponse.headers.cardnumber).toBe("1234432156788765");
    expect(unmaskedResponse.headers.cvv).toBe("893");
  });

  it("must unmask the sensitive data in the query", async () => {
    const payload = {
      foo: "bar",
      bar: "foo",
    };

    const { body: mirrorResponse } = await request(blueboxInboundApp)
      .post("/?cardNumber=1234123412341234")
      .set("Accept", "application/json")
      .send(payload)
      .expect("Content-Type", /json/)
      .expect(200);

    const { body: unmaskedResponse } = await request(blueboxOutboundApp)
      .post(`/?cardNumber=${mirrorResponse.query.cardNumber}`)
      .set("Accept", "application/json")
      .set("x-bluebox-target", "http://mirror:9000")
      .send(mirrorResponse.body)
      .expect(200);

    expect(unmaskedResponse.body).toEqual({
      foo: "bar",
      bar: "foo",
    });
    expect(unmaskedResponse.query.cardNumber).toBe("1234123412341234");
  });

  it("must return the same response status code as the target", async () => {
    const { body: mirrorResponse } = await request(blueboxInboundApp)
      .post("/")
      .set("Accept", "application/json")
      .send({})
      .expect(200);

    const { body: unmaskedResponse } = await request(blueboxOutboundApp)
      .post("/")
      .set("Accept", "application/json")
      .set("x-bluebox-target", "http://mirror:9000/badrequest")
      .send(mirrorResponse.body)
      .expect(400);

    expect(unmaskedResponse.statusCode).toBe(mirrorResponse.statusCode);
  });
});
