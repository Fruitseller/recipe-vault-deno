import {
  CreateRecipeDto,
  Recipe,
  UpdateRecipeDto,
} from "../domain/models/recipe.ts";

export class RecipeRepository {
  private recipes: Map<string, Recipe> = new Map();

  async findAll() {
    return Array.from(this.recipes.values());
  }

  async findById(id: string) {
    return this.recipes.get(id) || null;
  }

  async create(dto: CreateRecipeDto) {
    const recipe = {
      ...dto,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.recipes.set(recipe.id, recipe);
    return recipe;
  }

  async update(id: string, dto: UpdateRecipeDto) {
    const existing = this.recipes.get(id);
    if (!existing) {
      return null;
    }

    const updated: Recipe = {
      ...existing,
      ...dto,
      updatedAt: new Date(),
    };

    this.recipes.set(id, updated);
    return updated;
  }

  async delete(id: string) {
    return this.recipes.delete(id);
  }
}
