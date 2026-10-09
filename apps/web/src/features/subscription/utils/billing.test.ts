import {
  billingErrorMessage,
  formatCents,
  isValidCardNumber,
  isValidCpf,
  maskCardNumber,
  maskCpf,
  maskExpiry,
  maskPhone,
  parseExpiry,
} from "./billing";

describe("billing masks", () => {
  it("masks CPF, phone, card and expiry as the user types", () => {
    expect(maskCpf("52998224725")).toBe("529.982.247-25");
    expect(maskPhone("11987654321")).toBe("(11) 98765-4321");
    expect(maskCardNumber("4242424242424242")).toBe("4242 4242 4242 4242");
    expect(maskExpiry("1230")).toBe("12/30");
  });
});

describe("billing validation mirrors the API", () => {
  it("checks the CPF verifier digits", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });

  it("checks the card number with Luhn", () => {
    expect(isValidCardNumber("4242 4242 4242 4242")).toBe(true);
    expect(isValidCardNumber("4242 4242 4242 4241")).toBe(false);
  });

  it("rejects an expired card", () => {
    const nextYear = String((new Date().getFullYear() + 1) % 100).padStart(2, "0");
    expect(parseExpiry(`12/${nextYear}`)).toEqual({ month: "12", year: `20${nextYear}` });
    expect(parseExpiry("01/20")).toBeNull();
    expect(parseExpiry("13/40")).toBeNull();
  });
});

describe("billing display", () => {
  it("formats cents as BRL", () => {
    expect(formatCents(3499).replace(/\s/g, " ")).toBe("R$ 34,99");
  });

  it("maps API error codes to Portuguese messages", () => {
    const declined = { response: { status: 400, data: { error: "CARD_DECLINED" } } };
    expect(billingErrorMessage(declined)).toMatch(/cartão foi recusado/);
    expect(billingErrorMessage({ response: { status: 500, data: {} } }, "fallback")).toBe("fallback");
  });
});
