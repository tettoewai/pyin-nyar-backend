import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@/auth/decorators/auth.guard.js";
import { RolesGuard } from "@/auth/decorators/role.guard.js";
import type { AccessPayload, TokenService } from "@/auth/token.service.js";

interface RequestMock {
  headers: Record<string, string | undefined>;
  user?: AccessPayload;
}

function createContext(request: RequestMock): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

function bearerMock(user: Partial<AccessPayload> = {}): AccessPayload {
  return {
    sub: "user_1",
    email: "student@example.com",
    role: "STUDENT",
    ...user,
  } as AccessPayload;
}

describe("AuthGuard", () => {
  let guard: AuthGuard;
  let verifyToken: ReturnType<typeof vi.fn>;
  let getAllAndOverride: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    verifyToken = vi.fn();
    getAllAndOverride = vi.fn().mockReturnValue(false);
    guard = new AuthGuard(
      { verifyToken } as unknown as TokenService,
      { getAllAndOverride } as unknown as Reflector,
    );
  });

  it("skips verification for routes marked @Public()", async () => {
    getAllAndOverride.mockReturnValueOnce(true);

    const request: RequestMock = { headers: {} };
    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("throws 401 when the Authorization header is missing", async () => {
    const error = await guard
      .canActivate(createContext({ headers: {} }))
      .catch((e) => e);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(error.getStatus()).toBe(401);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("throws 401 for a non-Bearer scheme", async () => {
    const error = await guard
      .canActivate(createContext({ headers: { authorization: "Basic abc" } }))
      .catch((e) => e);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(error.getStatus()).toBe(401);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("throws 401 for an empty Bearer token", async () => {
    const error = await guard
      .canActivate(createContext({ headers: { authorization: "Bearer " } }))
      .catch((e) => e);

    expect(error.getStatus()).toBe(401);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("attaches the payload to the request for a valid token", async () => {
    const payload = bearerMock();
    verifyToken.mockResolvedValueOnce(payload);

    const request: RequestMock = {
      headers: { authorization: "Bearer valid.jwt.token" },
    };
    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(verifyToken).toHaveBeenCalledWith("valid.jwt.token");
    expect(request.user).toEqual(payload);
  });

  // D2 regression: an expired/invalid token must map to 401, never 403,
  // otherwise the mobile client's refresh-on-401 flow never runs.
  it("propagates an UnauthorizedException from TokenService as 401", async () => {
    verifyToken.mockRejectedValueOnce(
      new UnauthorizedException("Invalid or expired access token."),
    );

    const error = await guard
      .canActivate(
        createContext({ headers: { authorization: "Bearer expired.jwt" } }),
      )
      .catch((e) => e);

    expect(error.getStatus()).toBe(401);
    expect(error).not.toBeInstanceOf(ForbiddenException);
  });

  it("maps any unexpected verification error to 401, not 403", async () => {
    verifyToken.mockRejectedValueOnce(
      new Error("secret or public key missing"),
    );

    const request: RequestMock = {
      headers: { authorization: "Bearer whatever" },
    };
    const error = await guard
      .canActivate(createContext(request))
      .catch((e) => e);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(error.getStatus()).toBe(401);
    expect(error).not.toBeInstanceOf(ForbiddenException);
    expect(request.user).toBeUndefined();
  });
});

describe("RolesGuard", () => {
  function createRolesGuard(required: string[] | undefined): RolesGuard {
    return new RolesGuard({
      getAllAndOverride: vi.fn().mockReturnValue(required),
    } as unknown as Reflector);
  }

  it("allows requests on routes without @Roles()", () => {
    expect(
      createRolesGuard(undefined).canActivate(createContext({ headers: {} })),
    ).toBe(true);
  });

  it("throws 401 when no user is attached to the request", () => {
    expect(() =>
      createRolesGuard(["ADMIN"]).canActivate(createContext({ headers: {} })),
    ).toThrow(UnauthorizedException);
  });

  it("throws 403 when the authenticated role is not permitted", () => {
    const request: RequestMock = {
      headers: {},
      user: bearerMock({ role: "STUDENT" }),
    };

    const error = (() => {
      try {
        return createRolesGuard(["ADMIN"]).canActivate(createContext(request));
      } catch (e) {
        return e;
      }
    })();

    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getStatus()).toBe(403);
  });

  it("allows the permitted role", () => {
    const request: RequestMock = {
      headers: {},
      user: bearerMock({ role: "ADMIN" }),
    };

    expect(
      createRolesGuard(["ADMIN"]).canActivate(createContext(request)),
    ).toBe(true);
  });
});
