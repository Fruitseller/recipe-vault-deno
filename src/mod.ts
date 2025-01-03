import { Router } from "./router/router.ts";

const startServer = () => {
  const router = new Router();

  router.get("/", async () => {
    return new Response(
      JSON.stringify({ message: "Welcome from RecipeVault" }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }).get("/health", async () => {
    return new Response(
      JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  });

  console.log("Server started at http://0.0.0.0:8000");
  Deno.serve({ port: 8000 }, router.handle);
};

try {
  startServer();
} catch (error) {
  console.error("Error on start: ", error);
  Deno.exit(1);
}
