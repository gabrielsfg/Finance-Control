import { describe, expect, it } from "vitest";
import { buildCsv, csvAmount, csvDate, csvNumber } from "./csv";

type Row = { description: string; value: number };

const columns = [
  { header: "Descrição", value: (r: Row) => r.description },
  { header: "Valor", value: (r: Row) => csvAmount(r.value) },
];

describe("buildCsv", () => {
  it("writes a BOM, semicolons and CRLF so Excel pt-BR opens it straight", () => {
    const csv = buildCsv<Row>([{ description: "Mercado", value: 123456 }], columns);

    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("Descrição;Valor");
    expect(csv).toContain("Mercado;1234,56");
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(2);
  });

  it("quotes cells carrying a separator, a quote or a line break", () => {
    const csv = buildCsv<Row>(
      [{ description: 'Loja "A"; filial\nCentro', value: 0 }],
      columns,
    );

    expect(csv).toContain('"Loja ""A""; filial\nCentro"');
  });

  // A cell starting with =, + or @ runs as a formula when the file is opened, and
  // descriptions are user-written — this is the CSV injection path.
  it.each(["=1+1", "+SUM(A1)", "@cmd", "-cmd"])("defuses the formula %s", (payload) => {
    const csv = buildCsv<Row>([{ description: payload, value: 0 }], columns);

    expect(csv).toContain(`'${payload}`);
  });

  it("leaves a negative number alone", () => {
    const csv = buildCsv<Row>([{ description: "-12,34", value: 0 }], columns);

    expect(csv).not.toContain("'-12,34");
  });

  it("writes an empty cell for null and undefined", () => {
    const csv = buildCsv<{ a: string | null; b: undefined }>(
      [{ a: null, b: undefined }],
      [
        { header: "A", value: (r) => r.a },
        { header: "B", value: (r) => r.b },
      ],
    );

    expect(csv).toContain("\r\n;\r\n");
  });
});

describe("csv value formatting", () => {
  it("formats cents with a decimal comma and keeps the sign", () => {
    expect(csvAmount(123456)).toBe("1234,56");
    expect(csvAmount(-500)).toBe("-5,00");
    expect(csvAmount(0)).toBe("0,00");
  });

  it("formats plain numbers with the requested precision", () => {
    expect(csvNumber(1.5)).toBe("1,50");
    expect(csvNumber(1.23456, 4)).toBe("1,2346");
  });

  it("turns an ISO date into dd/mm/aaaa, with or without a time part", () => {
    expect(csvDate("2026-08-24")).toBe("24/08/2026");
    expect(csvDate("2026-08-24T13:45:00Z")).toBe("24/08/2026");
  });

  it("returns an empty cell for a missing date", () => {
    expect(csvDate(null)).toBe("");
    expect(csvDate(undefined)).toBe("");
  });
});
