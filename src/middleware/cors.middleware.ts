export type CorsOptions = {
  allowOrigin: string | string[];
  allowMethods: string[];
  allowHeaders: string[];
  maxAge?: number;
};

export const createCorsMiddleware = (options: CorsOptions) => {
  // Normalisiere allowOrigin zu einem Array
  const origins = Array.isArray(options.allowOrigin)
    ? options.allowOrigin
    : [options.allowOrigin];

  return async (request: Request): Promise<Response | null> => {
    const origin = request.headers.get("origin");

    // Wenn kein Origin-Header gesetzt ist, ist es keine CORS-Anfrage
    if (!origin) {
      return null;
    }

    // Prüfe ob die Origin erlaubt ist
    const isAllowedOrigin = origins.includes("*") || origins.includes(origin);
    if (!isAllowedOrigin) {
      return new Response("Origin not allowed", { status: 403 });
    }

    // Handle Preflight OPTIONS requests
    if (request.method === "OPTIONS") {
      const headers = new Headers({
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": options.allowMethods.join(", "),
        "Access-Control-Allow-Headers": options.allowHeaders.join(", "),
        "Access-Control-Max-Age": `${options.maxAge ?? 86400}`,
      });

      return new Response(null, {
        status: 204,
        headers,
      });
    }

    // Für normale Anfragen geben wir null zurück und setzen nur die Response-Header
    // in der Router-Klasse
    return null;
  };
};
