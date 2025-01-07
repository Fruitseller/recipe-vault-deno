import { assertEquals, assertExists, assertThrows } from "../deps.ts";
import { Router } from "../src/router/router.ts";

Deno.test("Router - Path Validation", async (t) => {
  await t.step("should accept paths that start with /", () => {
    const router = new Router();
    router.get("/test", async () => new Response());
  });

  await t.step("should throw error for paths without /", () => {
    const router = new Router();
    assertThrows(
      () => router.get("test", async () => new Response()),
      Error,
      "Route path must start with '/'",
    );
  });
});

Deno.test("Router - HTTP Methods", async (t) => {
  await t.step("should accept all valid HTTP methods", () => {
    const router = new Router();
    const dummyHandler = async () => new Response();

    router.get("/test", dummyHandler);
    router.post("/test", dummyHandler);
    router.put("/test", dummyHandler);
    router.delete("/test", dummyHandler);
    router.patch("/test", dummyHandler);
    router.options("/test", dummyHandler);
  });
});

Deno.test("Router - Request Handling", async (t) => {
  await t.step("should return 404 for non-existent routes", async () => {
    const router = new Router();
    const request = new Request("http://localhost/nonexistent");
    const response = await router.handle(request);

    assertEquals(response.status, 404);
    const body = await response.json();
    assertEquals(body.error, "Not Found");
  });

  await t.step("should correctly handle registered routes", async () => {
    const router = new Router();
    const testMessage = "Hello, Test!";

    router.get("/test", async () => {
      return new Response(JSON.stringify({ message: testMessage }), {
        headers: { "content-type": "application/json" },
      });
    });

    const request = new Request("http://localhost/test");
    const response = await router.handle(request);

    assertEquals(response.status, 200);
    const body = await response.json();
    assertEquals(body.message, testMessage);
  });

  await t.step("should return 400 for invalid HTTP methods", async () => {
    const router = new Router();
    const request = new Request("http://localhost/test", {
      method: "INVALID",
    });

    const response = await router.handle(request);
    assertEquals(response.status, 400);

    const body = await response.json();
    assertEquals(body.error, "Bad Request");
    assertEquals(body.message, "Invalid HTTP method: INVALID");
  });
});

Deno.test("Router - Error Handling", async (t) => {
  await t.step("should return 500 when handler throws error", async () => {
    const router = new Router();
    const errorMessage = "Test Error";

    router.get("/error", async () => {
      throw new Error(errorMessage);
    });

    const request = new Request("http://localhost/error");
    const response = await router.handle(request);

    assertEquals(response.status, 500);
    const body = await response.json();
    assertEquals(body.error, "Internal Server Error");
    assertEquals(body.message, errorMessage);
  });
});

Deno.test("Router - Response Headers", async (t) => {
  await t.step(
    "should always include content-type for JSON responses",
    async () => {
      const router = new Router();
      const request = new Request("http://localhost/nonexistent");
      const response = await router.handle(request);

      assertEquals(response.headers.get("content-type"), "application/json");

      const body = await response.json();
      assertExists(body.error);
    },
  );

  await t.step("should preserve custom headers from handlers", async () => {
    const router = new Router();
    const customHeaderName = "X-Custom-Header";
    const customHeaderValue = "test-value";

    router.get("/test", async () => {
      return new Response(JSON.stringify({ message: "test" }), {
        headers: {
          "content-type": "application/json",
          [customHeaderName]: customHeaderValue,
        },
      });
    });

    const response = await router.handle(new Request("http://localhost/test"));
    assertEquals(response.headers.get(customHeaderName), customHeaderValue);
  });
});
