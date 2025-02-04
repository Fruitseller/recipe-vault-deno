import { RecipeService } from "../services/recipe.service.ts";
import { ValidationError } from "../domain/validation/errors.ts";
import {
  validateCreateRecipeDto,
  validateUpdateRecipeDto,
} from "../domain/validation/recipe.validation.ts";

// Der Controller wandelt HTTP-Anfragen in Service-Aufrufe um und formatiert die Antworten
export class RecipeController {
  constructor(private service: RecipeService) {}

  // Hilfsmethode für konsistente API-Antworten
  private createResponse<T>(data: T): Response {
    return new Response(
      JSON.stringify({ data, timestamp: new Date().toISOString() }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  }

  // Hilfsmethode für einheitliche Fehlerbehandlung
  private handleError(error: unknown): Response {
    console.error("Error in RecipeController:", error);

    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          error: {
            type: error.type,
            message: error.message,
            details: error.details,
          },
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    // Allgemeine Fehlerbehandlung
    return new Response(
      JSON.stringify({
        error: {
          type: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }

  // Handler für die verschiedenen HTTP-Methoden
  async handleGetAll(_request: Request): Promise<Response> {
    try {
      const recipes = await this.service.getAllRecipes();
      return this.createResponse(recipes);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async handleGetById(
    _request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const recipe = await this.service.getRecipeById(params.id);
      if (!recipe) {
        return new Response(
          JSON.stringify({
            error: {
              type: "NOT_FOUND",
              message: "Recipe not found",
            },
            timestamp: new Date().toISOString(),
          }),
          {
            status: 404,
            headers: { "content-type": "application/json" },
          },
        );
      }
      return this.createResponse(recipe);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async handleCreate(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const validatedData = validateCreateRecipeDto(body);
      const recipe = await this.service.createRecipe(validatedData);
      return this.createResponse(recipe);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async handleUpdate(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const body = await request.json();
      const validatedData = validateUpdateRecipeDto(body);
      const recipe = await this.service.updateRecipe(params.id, validatedData);

      if (!recipe) {
        return new Response(
          JSON.stringify({
            error: {
              type: "NOT_FOUND",
              message: "Recipe not found",
            },
            timestamp: new Date().toISOString(),
          }),
          {
            status: 404,
            headers: { "content-type": "application/json" },
          },
        );
      }

      return this.createResponse(recipe);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async handleDelete(
    _request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const deleted = await this.service.deleteRecipe(params.id);
      if (!deleted) {
        return new Response(
          JSON.stringify({
            error: {
              type: "NOT_FOUND",
              message: "Recipe not found",
            },
            timestamp: new Date().toISOString(),
          }),
          {
            status: 404,
            headers: { "content-type": "application/json" },
          },
        );
      }
      return this.createResponse({ success: true });
    } catch (error) {
      return this.handleError(error);
    }
  }
}
