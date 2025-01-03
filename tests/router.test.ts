// tests/router.test.ts
import { assertEquals, assertThrows } from "../deps.ts";
import { Router, RoutePath } from "../src/router/router.ts";

// Path validation tests ensure our router properly handles URL paths
Deno.test("Router - Path Validation", async (t) => {
  await t.step("should accept paths that start with /", () => {
    const router = new Router();
    // This test verifies that valid paths work without throwing errors
    router.get("/test", async () => new Response());
  });

  await t.step("should throw error for paths without /", () => {
    const router = new Router();
    assertThrows(
        () => router.get("test", async () => new Response()),
        Error,
        "Route path must start with '/'"
    );
  });
});

// HTTP method tests verify our router handles different request types correctly
Deno.test("Router - HTTP Methods", async (t) => {
  await t.step("should accept all valid HTTP methods", () => {
    const router = new Router();
    const dummyHandler = async () => new Response();

    // Testing each supported HTTP method ensures complete method coverage
    router.get("/test", dummyHandler);
    router.post("/test", dummyHandler);
    router.put("/test", dummyHandler);
    router.delete("/test", dummyHandler);
    router.patch("/test", dummyHandler);
    router.options("/test", dummyHandler);
  });
});

// Request handling tests check the core routing functionality
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
        headers: { "content-type": "application/json" }
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
      method: "INVALID"
    });

    const response = await router.handle(request);
    assertEquals(response.status, 400);

    const body = await response.json();
    assertEquals(body.error, "Bad Request");
    assertEquals(body.message, "Invalid HTTP method: INVALID");
  });
});

// Error handling tests ensure our router gracefully handles errors
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
