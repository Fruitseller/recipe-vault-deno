import { validators } from "../../src/domain/validation/validators.ts";
import {
  ValidationError,
  ValidationErrorType,
} from "../../src/domain/validation/errors.ts";
import {assertEquals} from "../../deps.ts";

Deno.test("requiredString validator", async (t) => {
  await t.step("handles required field violations", () => {
    const validate = validators.requiredString("testField");

    try {
      validate(undefined);
    } catch (error) {
      // Fügen Sie eine Typ-Guard hinzu, um das unknown-Problem zu beheben
      if (!(error instanceof ValidationError)) {
        throw error; // Werfen Sie unerwartete Fehler weiter
      }

      assertEquals(error.type, ValidationErrorType.REQUIRED_FIELD);
      assertEquals(error.details.field, "testField");
    }
  });

  await t.step("handles invalid input", () => {
    const validate = validators.requiredString("testField");
    const invalidInputs = ["", "   ", 123];

    invalidInputs.forEach((input) => {
      try {
        validate(input as unknown);
      } catch (error) {
        if (!(error instanceof ValidationError)) {
          throw error;
        }

        assertEquals(error.type, ValidationErrorType.INVALID_INPUT);
        assertEquals(error.details.field, "testField");
      }
    });
  });
});
