import { RecipeRepository } from "../repositories/recipe.repository.ts";
import { CreateRecipeDto, UpdateRecipeDto } from "../domain/models/recipe.ts";

export class RecipeService {
  constructor(private repository: RecipeRepository) {
  }

  async getAllRecipes() {
    return await this.repository.findAll();
  }

  async getRecipeById(id: string) {
    return await this.repository.findById(id);
  }

  async createRecipe(dto: CreateRecipeDto) {
    return await this.repository.create(dto);
  }

  async updateRecipe(id: string, dto: UpdateRecipeDto) {
    return await this.repository.update(id, dto);
  }

  async deleteRecipe(id: string) {
    return await this.repository.delete(id);
  }
}
