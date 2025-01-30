// Wir definieren die grundlegenden Fehlertypen, die die häufigsten Validierungsfälle abdecken
export enum ValidationErrorType {
  INVALID_INPUT = "INVALID_INPUT", // Für Formatierungsfehler wie falsche Datentypen oder ungültige Formate
  REQUIRED_FIELD = "REQUIRED_FIELD", // Für fehlende Pflichtfelder
  BUSINESS_RULE = "BUSINESS_RULE", // Für Verletzungen von Geschäftsregeln wie "Liste darf nicht leer sein"
}

// Die ValidationError-Klasse enthält alle notwendigen Informationen für sinnvolles Fehler-Handling
export class ValidationError extends Error {
  constructor(
    message: string,
    public type: ValidationErrorType,
    // Details-Objekt ist flexibel, aber enthält typischerweise das betroffene Feld
    public details: {
      field?: string;
      [key: string]: unknown;
    },
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
