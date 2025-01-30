import { ValidationError, ValidationErrorType } from "./errors.ts";
import { validators } from "./validators.ts";
import { CreateRecipeDto, UpdateRecipeDto } from "../models/recipe.ts";

// Diese Funktion validiert ein neues Rezept. Sie prüft, ob alle erforderlichen
// Felder vorhanden und korrekt formatiert sind.
export function validateCreateRecipeDto(data: unknown): CreateRecipeDto {
  // Zuerst prüfen wir, ob wir überhaupt ein Objekt haben
  if (!data || typeof data !== "object") {
    throw new ValidationError(
      "Invalid recipe data",
      ValidationErrorType.INVALID_INPUT,
      { receivedType: typeof data },
    );
  }

  const input = data as Record<string, unknown>;

  // Wir verwenden unsere Validator-Funktionen für jedes Feld.
  // Da diese bereits die korrekten ValidationError-Typen werfen,
  // müssen wir hier keine zusätzliche Fehlerbehandlung implementieren.
  return {
    title: validators.requiredString("title")(input.title),
    description: validators.requiredString("description")(input.description),
    ingredients: validators.requiredStringArray("ingredients")(
      input.ingredients,
    ),
    instructions: validators.requiredStringArray("instructions")(
      input.instructions,
    ),
    imageUrl: validators.optionalString("imageUrl")(input.imageUrl),
  };
}

// Diese Funktion validiert Aktualisierungen eines bestehenden Rezepts.
// Sie erlaubt partielle Updates, prüft aber die vorhandenen Felder genauso streng.
export function validateUpdateRecipeDto(data: unknown): UpdateRecipeDto {
  // Auch hier prüfen wir zuerst, ob wir ein Objekt haben
  if (!data || typeof data !== "object") {
    throw new ValidationError(
      "Invalid update data",
      ValidationErrorType.INVALID_INPUT,
      { receivedType: typeof data },
    );
  }

  const input = data as Record<string, unknown>;
  const validated: UpdateRecipeDto = {};

  // Wir prüfen nur die Felder, die tatsächlich aktualisiert werden sollen.
  // 'in' prüft explizit auf die Existenz der Property, auch wenn sie undefined ist.
  if ("title" in input) {
    validated.title = validators.requiredString("title")(input.title);
  }
  if ("description" in input) {
    validated.description = validators.requiredString("description")(
      input.description,
    );
  }
  if ("ingredients" in input) {
    validated.ingredients = validators.requiredStringArray("ingredients")(
      input.ingredients,
    );
  }
  if ("instructions" in input) {
    validated.instructions = validators.requiredStringArray("instructions")(
      input.instructions,
    );
  }
  if ("imageUrl" in input) {
    validated.imageUrl = validators.optionalString("imageUrl")(input.imageUrl);
  }

  // Wir stellen sicher, dass mindestens ein Feld aktualisiert wird
  if (Object.keys(validated).length === 0) {
    throw new ValidationError(
      "Update must contain at least one field",
      ValidationErrorType.BUSINESS_RULE,
      { receivedFields: Object.keys(input) },
    );
  }

  return validated;
}
