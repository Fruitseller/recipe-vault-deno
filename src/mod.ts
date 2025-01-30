// src/mod.ts
import { Router } from "./router/router.ts";
import { RecipeController } from "./controllers/recipe.controller.ts";
import { RecipeService } from "./services/recipe.service.ts";
import { RecipeRepository } from "./repositories/recipe.repository.ts";

const startServer = () => {
  // Dependency Injection aufbauen
  const repository = new RecipeRepository();
  const service = new RecipeService(repository);
  const controller = new RecipeController(service);

  const router = new Router();

  // API-Routen registrieren
  router
  .get("/recipes", controller.handleGetAll.bind(controller))
  .get("/recipes/:id", controller.handleGetById.bind(controller))
  .post("/recipes", controller.handleCreate.bind(controller))
  .put("/recipes/:id", controller.handleUpdate.bind(controller))
  .delete("/recipes/:id", controller.handleDelete.bind(controller));

  // Basis-Routen für Health-Checks etc.
  router
  .get("/", async () => {
    return new Response(
        JSON.stringify({ message: "Welcome to RecipeVault API" }),
        { status: 200, headers: { "content-type": "application/json" } }
    );
  })
  .get("/health", async () => {
    return new Response(
        JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
        { status: 200, headers: { "content-type": "application/json" } }
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
