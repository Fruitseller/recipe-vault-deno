export type RequestHandler = (request: Request) => Promise<Response>;

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
}

export class Router {
  private routes: Route[] = [];

  private addRoute = (
    method: HttpMethod,
    path: string,
    handler: RequestHandler,
  ) => {
    const routePath = createRoutePath(path);
    this.routes.push({ method, path: routePath, handler });
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
    const url = new URL(request.url);
    const pathToMatch = createRoutePath(url.pathname);
    const method = request.method;

    if (!isValidHttpMethod(method)) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: `Invalid HTTP method: ${method}`,
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }

    const route = this.routes.find((r) =>
      r.path === pathToMatch && r.method === method
    );

    if (route) {
      try {
        return await route.handler(request);
      } catch (error) {
        if (error instanceof Error) {
          return new Response(
            JSON.stringify({
              error: "Internal Server Error",
              message: error.message,
            }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        } else {
          return new Response(
            JSON.stringify({
              error: "Internal Server Error",
              message: "An unknown error occured",
            }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        error: "Not Found",
        message: `Cannot ${method} ${pathToMatch}`,
      }),
      { status: 404, headers: { "content-type": "application/json" } },
    );
  };
}
