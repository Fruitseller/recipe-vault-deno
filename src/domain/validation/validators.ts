import { ValidationError, ValidationErrorType } from "./errors.ts";

export type ValidatorFn<T> = (value: unknown) => T;

export const validators = {
  requiredString(fieldName: string): ValidatorFn<string> {
    return (value: unknown) => {
      // Bei fehlendem Wert werfen wir einen REQUIRED_FIELD Fehler
      if (value === undefined || value === null) {
        throw new ValidationError(
          `${fieldName} is required`,
          ValidationErrorType.REQUIRED_FIELD,
          { field: fieldName },
        );
      }

      // Bei ungültigem Format werfen wir einen INVALID_INPUT Fehler
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new ValidationError(
          `${fieldName} must be a non-empty string`,
          ValidationErrorType.INVALID_INPUT,
          { field: fieldName, receivedValue: value },
        );
      }

      return value.trim();
    };
  },

  requiredStringArray(fieldName: string): ValidatorFn<string[]> {
    return (value: unknown) => {
      if (value === undefined || value === null) {
        throw new ValidationError(
          `${fieldName} is required`,
          ValidationErrorType.REQUIRED_FIELD,
          { field: fieldName },
        );
      }

      if (!Array.isArray(value)) {
        throw new ValidationError(
          `${fieldName} must be an array`,
          ValidationErrorType.INVALID_INPUT,
          { field: fieldName, receivedType: typeof value },
        );
      }

      // Leere Liste ist eine Verletzung einer Geschäftsregel
      if (value.length === 0) {
        throw new ValidationError(
          `${fieldName} cannot be empty`,
          ValidationErrorType.BUSINESS_RULE,
          { field: fieldName },
        );
      }

      if (
        !value.every((item) =>
          typeof item === "string" && item.trim().length > 0
        )
      ) {
        throw new ValidationError(
          `${fieldName} must contain non-empty strings`,
          ValidationErrorType.INVALID_INPUT,
          {
            field: fieldName,
            invalidItems: value.filter((item) =>
              typeof item !== "string" || item.trim().length === 0
            ),
          },
        );
      }

      return value.map((item) => item.trim());
    };
  },

  // Die optionalString Funktion für optionale Felder
  optionalString(fieldName: string): ValidatorFn<string | undefined> {
    return (value: unknown) => {
      // Wenn kein Wert vorhanden ist, geben wir undefined zurück
      if (value === undefined || value === null) {
        return undefined;
      }

      // Wenn ein Wert vorhanden ist, muss er den String-Regeln entsprechen
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new ValidationError(
          `${fieldName} if provided must be a non-empty string`,
          ValidationErrorType.INVALID_INPUT,
          { field: fieldName, receivedValue: value },
        );
      }

      return value.trim();
    };
  },
};
