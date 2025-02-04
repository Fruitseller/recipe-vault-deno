export type Middleware = (
  request: Request,
) => Promise<Response | null>;

export type RouteParams = Record<string, string>;

export type RequestHandler = (
  request: Request,
  params: RouteParams,
) => Promise<Response>;

type RouteSegment = {
  isParameter: boolean;
  value: string;
};

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS";

const isValidHttpMethod = (method: string): method is HttpMethod => {
  return ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"].includes(method);
};

export type RoutePath = string & { _brand: "RoutePath" };

const createRoutePath = (path: string): RoutePath => {
  if (!path.startsWith("/")) {
    throw new Error("Route path must start with '/'");
  }

  return path as RoutePath;
};

export interface Route {
  path: RoutePath;
  method: HttpMethod;
  handler: RequestHandler;
  segments: RouteSegment[];
}

export class Router {
  private routes: Route[] = [];
  private middlewares: Middleware[] = [];

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  private parseSegments = (path: string): RouteSegment[] => {
    return path.split("/").filter(Boolean).map((segment) => ({
      isParameter: segment.startsWith(":"),
      value: segment.startsWith(":") ? segment.slice(1) : segment,
    }));
  };

  private matchPath = (
    routeSegments: RouteSegment[],
    urlSegments: string[],
  ): RouteParams | null => {
    if (routeSegments.length !== urlSegments.length) {
      return null;
    }

    const params: RouteParams = {};

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      const urlSegment = urlSegments[i];

      if (routeSegment.isParameter) {
        params[routeSegment.value] = urlSegment;
      } else if (routeSegment.value !== urlSegment) {
        return null;
      }
    }

    return params;
  };

  private createErrorResponse = (
    status: number,
    error: string,
    message: string,
  ): Response => {
    return new Response(
      JSON.stringify({
        error,
        message,
      }),
      { status, headers: { "content-type": "application/json" } },
    );
  };

  private executeHandler = async (
    handler: RequestHandler,
    request: Request,
    params: RouteParams,
  ): Promise<Response> => {
    try {
      return await handler(request, params);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "An unknown error occured";
      return this.createErrorResponse(500, "Internal Server Error", message);
    }
  };

  private findMatchingRoute = (method: HttpMethod, urlSegments: string[]) => {
    for (const route of this.routes) {
      if (route.method !== method) {
        continue;
      }

      const params = this.matchPath(route.segments, urlSegments);
      if (params !== null) {
        return { route, params };
      }
    }

    return null;
  };

  private addRoute = (
    method: HttpMethod,
    path: string,
    handler: RequestHandler,
  ) => {
    const routePath = createRoutePath(path);
    const segments = this.parseSegments(path);
    this.routes.push({ method, path: routePath, handler, segments });
  };

  get = (path: string, handler: RequestHandler) => {
    this.addRoute("GET", path, handler);
    return this;
  };

  post = (path: string, handler: RequestHandler) => {
    this.addRoute("POST", path, handler);
    return this;
  };

  put = (path: string, handler: RequestHandler) => {
    this.addRoute("PUT", path, handler);
    return this;
  };

  delete = (path: string, handler: RequestHandler) => {
    this.addRoute("DELETE", path, handler);
    return this;
  };

  patch = (path: string, handler: RequestHandler) => {
    this.addRoute("PATCH", path, handler);
    return this;
  };

  options = (path: string, handler: RequestHandler) => {
    this.addRoute("OPTIONS", path, handler);
    return this;
  };

  handle = async (request: Request): Promise<Response> => {
    try {
      for (const middleware of this.middlewares) {
        const response = await middleware(request);
        if (response) {
          return response;
        }
      }

      const url = new URL(request.url);
      const path = createRoutePath(url.pathname);
      const method = request.method;

      if (!isValidHttpMethod(method)) {
        return this.createErrorResponse(
          400,
          "Bad Request",
          `Invalid HTTP method: ${method}`,
        );
      }

      const urlSegments = path.split("/").filter(Boolean);
      const match = this.findMatchingRoute(method, urlSegments);

      if (!match) {
        return this.createErrorResponse(
          404,
          "Not Found",
          `Cannot ${method} ${path}`,
        );
      }

      const response = await this.executeHandler(
        match.route.handler,
        request,
        match.params,
      );

      const headers = new Headers(response.headers);

      const origin = request.headers.get("origin");
      if (origin) {
        headers.set("Access-Control-Allow-Origin", origin);
        headers.set("Vary", "Origin");
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : "An unknown error occurred";
      return this.createErrorResponse(500, "Internal Server Error", message);
    }
  };
}
