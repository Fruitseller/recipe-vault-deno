import {ValidationError, ValidationErrorType} from "../../src/domain/validation/errors.ts";
import {validateCreateRecipeDto, validateUpdateRecipeDto} from "../../src/domain/validation/recipe.validation.ts";
import {assertEquals} from "../../deps.ts";

function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

function assertValidationError(
    error: unknown,
    expectedType: ValidationErrorType
): asserts error is ValidationError {
  if (isValidationError(error)) {
    assertEquals(error.type, expectedType);
  } else {
    throw new Error(`Expected ValidationError but got ${error}`);
  }
}

// Wir erstellen Hilfsfunktionen für häufig verwendete Testdaten
function createValidRecipeData() {
  return {
    title: "Carbonara",
    description: "Classic Italian pasta dish",
    ingredients: ["Spaghetti", "Eggs", "Pecorino", "Guanciale"],
    instructions: ["Boil pasta", "Prepare sauce", "Combine and serve"],
    imageUrl: "https://example.com/carbonara.jpg"
  };
}

Deno.test("Recipe Validation - Create Recipe", async (t) => {
  // Wir testen zuerst den erfolgreichen Fall, da er das erwartete Standardverhalten zeigt
  await t.step("validates complete and valid recipe data", () => {
    const validData = createValidRecipeData();
    const validated = validateCreateRecipeDto(validData);
    assertEquals(validated, validData, "should accept valid recipe without changes");
  });

  await t.step("validates recipe without optional imageUrl", () => {
    const {imageUrl: _imageUrl, ...requiredData } = createValidRecipeData();
    const validated = validateCreateRecipeDto(requiredData);
    assertEquals(validated.imageUrl, undefined, "should accept missing optional imageUrl");
    assertEquals(validated.title, requiredData.title, "should keep required fields unchanged");
  });

  await t.step("trims whitespace from string fields", () => {
    const validData = createValidRecipeData();
    const inputWithWhitespace = {
      ...validData,
      title: "  Carbonara  ",
      ingredients: ["  Spaghetti  ", "Eggs"],
    };

    const validated = validateCreateRecipeDto(inputWithWhitespace);
    assertEquals(validated.title, "Carbonara", "should trim title");
    assertEquals(validated.ingredients[0], "Spaghetti", "should trim array items");
  });

  await t.step("rejects missing required fields", () => {
    const testCases = [
      { field: 'title', data: { ...createValidRecipeData(), title: undefined } },
      { field: 'description', data: { ...createValidRecipeData(), description: undefined } },
      { field: 'ingredients', data: { ...createValidRecipeData(), ingredients: undefined } },
      { field: 'instructions', data: { ...createValidRecipeData(), instructions: undefined } }
    ];

    testCases.forEach(({ field, data }) => {
      try {
        validateCreateRecipeDto(data);
        throw new Error("Should have thrown ValidationError");
      } catch (error) {
        assertValidationError(error, ValidationErrorType.REQUIRED_FIELD);
        // Nach der Assertion weiß TypeScript, dass error ein ValidationError ist
        assertEquals(error.details.field, field);
      }
    });
  });
});

Deno.test("Recipe Validation - Update Recipe", async (t) => {
  await t.step("validates partial updates", () => {
    const updates = [
      { title: "New Title" },
      { ingredients: ["New Ingredient"] },
      { title: "New Title", description: "New Description" }
    ];

    updates.forEach(updateData => {
      const validated = validateUpdateRecipeDto(updateData);
      assertEquals(
          Object.keys(validated).length,
          Object.keys(updateData).length,
          "should keep the same number of fields"
      );

      // Prüfen Sie, ob die validierten Daten den Input-Daten entsprechen
      for (const [key, value] of Object.entries(updateData)) {
        assertEquals(validated[key as keyof typeof validated], value);
      }
    });
  });

  await t.step("handles empty updates correctly", () => {
    try {
      validateUpdateRecipeDto({});
      throw new Error("Should have thrown ValidationError");
    } catch (error) {
      assertValidationError(error, ValidationErrorType.BUSINESS_RULE);
    }
  });

  await t.step("validates array updates correctly", () => {
    const testCases = [
      {
        input: { ingredients: [] },
        expectedError: ValidationErrorType.BUSINESS_RULE
      },
      {
        input: { ingredients: ["", "Valid"] },
        expectedError: ValidationErrorType.INVALID_INPUT
      },
      {
        input: { instructions: ["Valid", 123] },
        expectedError: ValidationErrorType.INVALID_INPUT
      }
    ];

    testCases.forEach(({ input, expectedError }) => {
      try {
        validateUpdateRecipeDto(input);
        throw new Error("Should have thrown ValidationError");
      } catch (error) {
        assertValidationError(error, expectedError);
      }
    });
  });

  await t.step("trims whitespace in partial updates", () => {
    const updateData = {
      title: "  New Title  ",
      ingredients: ["  Ingredient 1  ", "  Ingredient 2  "]
    };

    const validated = validateUpdateRecipeDto(updateData);
    assertEquals(validated.title, "New Title", "should trim title");
    assertEquals(
        validated.ingredients,
        ["Ingredient 1", "Ingredient 2"],
        "should trim array items"
    );
  });
});
