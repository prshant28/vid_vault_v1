import express, { type Router } from "express";

export const mockUser = {
  id: "user-test-123",
  username: "testuser",
  name: "Test User",
  profileImage: null,
};

/**
 * Creates a test Express app that mounts `router` under /api.
 * The `authenticated` flag controls whether req.isAuthenticated() returns true
 * and whether req.user is populated.
 */
export function createTestApp(router: Router, authenticated = true) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use((req, _res, next) => {
    if (authenticated) {
      (req as any).isAuthenticated = () => true;
      (req as any).user = mockUser;
    } else {
      (req as any).isAuthenticated = () => false;
      (req as any).user = undefined;
    }
    (req as any).log = { error: () => {}, info: () => {}, debug: () => {} };
    next();
  });
  app.use("/api", router);
  return app;
}

/**
 * Creates a fluent Drizzle-like query chain that resolves to `result`.
 * Works for both "await db.select().from()..." and "await db.insert().values().returning()".
 */
export function makeDbChain(result: unknown[] = []) {
  // Use a Proxy so any method call returns the same chain, and await resolves to result
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "then") {
        return (
          resolve: (v: unknown) => unknown,
          reject?: (e: unknown) => unknown,
        ) => Promise.resolve(result).then(resolve, reject);
      }
      if (prop === "catch") {
        return (reject: (e: unknown) => unknown) =>
          Promise.resolve(result).catch(reject);
      }
      if (prop === "finally") {
        return (fn: () => void) => Promise.resolve(result).finally(fn);
      }
      if (prop === Symbol.toStringTag) return "Promise";
      // Any other property access returns a function that returns the same chain
      return () => new Proxy({}, handler);
    },
  };
  return new Proxy({}, handler);
}
