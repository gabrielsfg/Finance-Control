import { describe, expect, it } from "vitest";
import {
  getPasswordStrength,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationCodeSchema,
} from "./authSchema";

const validRegistration = {
  name: "Gabriel",
  email: "gabriel@example.com",
  password: "Senha!123",
  confirmPassword: "Senha!123",
  acceptedTerms: true,
};

describe("loginSchema", () => {
  it("accepts an e-mail and a password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("rejects a malformed e-mail", () => {
    expect(loginSchema.safeParse({ email: "a@b", password: "x" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts a complete registration", () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  // Mirrors RegisterUserValidator on the API: 8 chars, upper, lower, digit, symbol.
  it.each([
    ["short", "Ab!1"],
    ["no uppercase", "senha!123"],
    ["no lowercase", "SENHA!123"],
    ["no digit", "SenhaSenha!"],
    ["no symbol", "Senha1234"],
  ])("rejects a password with %s", (_label, password) => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      password,
      confirmPassword: password,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a mismatched confirmation, pointing at the confirmation field", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      confirmPassword: "Outra!123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });

  // The API refuses the registration without consent anyway — this only turns a
  // rejected request into a visible unchecked box.
  it("rejects an unchecked consent box", () => {
    const result = registerSchema.safeParse({ ...validRegistration, acceptedTerms: false });
    expect(result.success).toBe(false);
  });
});

describe("verificationCodeSchema", () => {
  it("accepts exactly six digits, trimming what was pasted", () => {
    expect(verificationCodeSchema.safeParse({ code: " 123456 " }).success).toBe(true);
  });

  it.each(["12345", "1234567", "12345a", ""])("rejects %s", (code) => {
    expect(verificationCodeSchema.safeParse({ code }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("applies the same password rules as registration", () => {
    const weak = { code: "123456", password: "senha", confirmPassword: "senha" };
    expect(resetPasswordSchema.safeParse(weak).success).toBe(false);

    const strong = { code: "123456", password: "Senha!123", confirmPassword: "Senha!123" };
    expect(resetPasswordSchema.safeParse(strong).success).toBe(true);
  });
});

describe("getPasswordStrength", () => {
  it("has no reading for an empty field", () => {
    expect(getPasswordStrength("")).toBeNull();
  });

  it("grades by how many rules the password already meets", () => {
    expect(getPasswordStrength("senha")).toBe("fraca");
    expect(getPasswordStrength("senha123")).toBe("média");
    expect(getPasswordStrength("Senha!123")).toBe("forte");
  });
});
