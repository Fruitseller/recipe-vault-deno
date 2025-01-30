import { assertEquals, assertExists, assertThrows } from "../../deps.ts";
import { RouteParams, Router } from "../../src/router/router.ts";

const createTestResponse = (status: number, params: unknown) => {
  return new Response(JSON.stringify(params), {
    status,
    headers: { "content-type": "application/json" },
  });
};

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

Deno.test("Router - Dynamic Parameters", async (t) => {
  await t.step("should extract single parameter from URL", async () => {
    const router = new Router();
    let capturedParams: RouteParams = {};

    router.get("/users/:id", async (_req, params) => {
      capturedParams = params;
      return createTestResponse(200, params);
    });

    await router.handle(new Request("http://localhost/users/123"));
    assertEquals(capturedParams.id, "123");
  });

  await t.step("should handle multiple parameters in route", async () => {
    const router = new Router();
    let capturedParams: RouteParams = {};

    router.get("/users/:userId/posts/:postId", async (_req, params) => {
      capturedParams = params;
      return createTestResponse(200, params);
    });

    await router.handle(new Request("http://localhost/users/123/posts/456"));
    assertEquals(capturedParams.userId, "123");
    assertEquals(capturedParams.postId, "456");
  });

  await t.step(
    "should correctly match mixed static and dynamic segments",
    async () => {
      const router = new Router();
      let capturedParams: RouteParams = {};

      router.get("/users/:id/profile", async (_req, params) => {
        capturedParams = params;
        return createTestResponse(200, params);
      });

      await router.handle(new Request("http://localhost/users/123/profile"));
      assertEquals(capturedParams.id, "123");

      const wrongResponse = await router.handle(
        new Request("http://localhost/users/123/settings"),
      );
      assertEquals(wrongResponse.status, 404);
    },
  );
});

Deno.test("Router - Parameter Error Cases", async (t) => {
  await t.step("should not match if segment count differs", async () => {
    const router = new Router();

    router.get("/users/:id", async (_req, params) => {
      return createTestResponse(200, params);
    });

    const response = await router.handle(
      new Request("http://localhost/users/123/extra"),
    );
    assertEquals(response.status, 404);
  });

  await t.step(
    "should handle parameters across different HTTP methods",
    async () => {
      const router = new Router();
      const responses: Record<string, RouteParams> = {};

      router.get("/users/:id", async (_reg, params) => {
        responses["GET"] = params;
        return createTestResponse(200, params);
      });

      router.post("/users/:id", async (_reg, params) => {
        responses["POST"] = params;
        return createTestResponse(201, params);
      });

      await router.handle(new Request("http://localhost/users/123"));
      assertEquals(responses["GET"].id, "123");

      const postResponse = await router.handle(
        new Request("http://localhost/users/456", { method: "POST" }),
      );
      assertEquals(responses["POST"].id, "456");
      assertEquals(postResponse.status, 201);
    },
  );
});
