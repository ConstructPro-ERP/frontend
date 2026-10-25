import { describe, it, expect } from "vitest";
import {
  roundMoney,
  lineAmount,
  totalAmount,
  validateItems,
  MAX_QUOTATION_AMOUNT,
} from "@/lib/quotationMoney";
import { quotationActions, safePdfUrl } from "@/lib/quotationActions";
import { ApiError } from "@/lib/ApiError";
import * as utils from "@/components/dashboard/quotations/quotationUtils";
import * as itemsApi from "@/services/quotationItemsApi";

describe("Quotation decimal parity", () => {
  it.each([
    [1.005, 1.01],
    [10.075, 10.08],
    [100.005, 100.01],
    [-1.005, -1.01],
    [0, 0],
    [100, 100],
    [1e-8, 0],
    [1e21, 1e21],
  ])("rounds %s to %s", (value, result) =>
    expect(roundMoney(value)).toBe(result),
  );
  it("rounds decimal products after multiplication and aggregates cents", () => {
    expect(lineAmount(3, 0.335)).toBe(1.01);
    expect(lineAmount(3, 33.33)).toBe(99.99);
    expect(
      totalAmount([
        { quantity: 1, unitPrice: 0.1 },
        { quantity: 1, unitPrice: 0.2 },
      ]),
    ).toBe(0.3);
    expect(totalAmount([{ quantity: 3, unitPrice: 0.335 }])).toBe(1.01);
    expect(totalAmount([])).toBe(0);
    expect(utils.round2(10.075)).toBe(10.08);
    expect(itemsApi.calculateItemTotal(3, 33.33)).toBe(99.99);
    expect(
      itemsApi.calculateQuotationGrandTotal([
        { itemName: "x", quantity: 1, unitPrice: 0 },
      ]),
    ).toBe(0);
  });
  it.each([NaN, Infinity, -Infinity])(
    "handles non-finite values without crashing render: %s",
    (value) => {
      expect(roundMoney(value)).toBeNaN();
      expect(lineAmount(1, value)).toBeNaN();
      expect(totalAmount([{ quantity: 1, unitPrice: value }])).toBeNaN();
    },
  );
  it("handles invalid quantities without crashing", () => {
    expect(lineAmount(1.5, 1)).toBeNaN();
    expect(totalAmount([{ quantity: 1.5, unitPrice: 1 }])).toBeNaN();
  });
  it.each([
    [[], "At least"],
    [[{ itemName: " ", quantity: 1, unitPrice: 1 }], "name"],
    [[{ itemName: "x", quantity: 0, unitPrice: 1 }], "quantity"],
    [[{ itemName: "x", quantity: 1.5, unitPrice: 1 }], "quantity"],
    [[{ itemName: "x", quantity: 2147483648, unitPrice: 1 }], "quantity"],
    [[{ itemName: "x", quantity: 1, unitPrice: Infinity }], "price"],
    [[{ itemName: "x", quantity: 1, unitPrice: -1 }], "price"],
    [[{ itemName: "x", quantity: 1, unitPrice: 1e10 }], "price"],
    [[{ itemName: "x", quantity: 1, unitPrice: 1.005 }], "decimal"],
    [
      [{ itemName: "x", quantity: 2, unitPrice: MAX_QUOTATION_AMOUNT }],
      "line total",
    ],
    [
      [
        { itemName: "x", quantity: 1, unitPrice: MAX_QUOTATION_AMOUNT },
        { itemName: "y", quantity: 1, unitPrice: 0.01 },
      ],
      "Quotation total",
    ],
  ] as const)("rejects invalid line data %#", (items, message) =>
    expect(validateItems([...items])).toContain(message),
  );
  it("accepts zero prices and largest persisted amount; preserves input", () => {
    const items = [
      { itemName: " x ", quantity: 1, unitPrice: MAX_QUOTATION_AMOUNT },
    ];
    expect(validateItems(items)).toBeNull();
    expect(
      validateItems([{ itemName: "x", quantity: 1, unitPrice: 0 }]),
    ).toBeNull();
    expect(itemsApi.validateLineItems(items)).toBeNull();
    expect(itemsApi.normalizeLineItems(items)).toEqual([
      { ...items[0], itemName: "x" },
    ]);
    expect(
      utils.validateQuotationForm({ leadId: "", notes: "", items: [] }),
    ).toHaveProperty("leadId");
    expect(
      utils.validateQuotationForm({ leadId: "lead", notes: "", items }),
    ).toEqual({});
    expect(utils.createQuotationFormValues().items).toHaveLength(1);
    expect(utils.formatCurrency(0.3)).toContain("0.30");
    expect(utils.formatCurrency(NaN)).toBe("—");
  });
});

describe("Quotation permissions and states", () => {
  const states = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "REJECTED",
    "CONVERTED",
    "UNKNOWN",
  ] as const;
  it.each(["ADMIN", "SALES_MANAGER"])(
    "allows only legal actions for %s",
    (role) => {
      expect(quotationActions(role, "DRAFT")).toEqual({
        edit: true,
        submit: true,
        approve: false,
        reject: false,
        revise: false,
        convert: false,
      });
      expect(quotationActions(role, "APPROVED")).toEqual({
        edit: false,
        submit: false,
        approve: false,
        reject: false,
        revise: false,
        convert: true,
      });
      expect(quotationActions(role, "PENDING_APPROVAL")).toEqual({
        edit: true,
        submit: false,
        approve: true,
        reject: true,
        revise: false,
        convert: true,
      });
      expect(quotationActions(role, "REJECTED").revise).toBe(true);
      expect(Object.values(quotationActions(role, "CONVERTED"))).not.toContain(
        true,
      );
      expect(Object.values(quotationActions(role, "UNKNOWN"))).not.toContain(
        true,
      );
      expect(utils.canCreateQuotation(role)).toBe(true);
      expect(utils.canApproveQuotation(role)).toBe(true);
      expect(utils.canRejectQuotation(role)).toBe(true);
    },
  );
  it.each([
    "PROJECT_MANAGER",
    "ACCOUNTANT",
    "CLIENT_PORTAL_USER",
    "SALES_REPRESENTATIVE",
    "MANAGER",
    null,
    undefined,
  ])("fails closed for %s", (role) => {
    for (const status of states)
      expect(Object.values(quotationActions(role, status))).not.toContain(true);
    expect(utils.canCreateQuotation(role)).toBe(false);
    expect(utils.canApproveQuotation(role)).toBe(false);
    expect(utils.canRejectQuotation(role)).toBe(false);
  });
  it("normalizes known states and keeps unsupported values non-editable", () => {
    for (const status of states.slice(0, 5)) {
      expect(utils.normalizeQuotationStatus(status)).toBe(status);
      expect(utils.getQuotationStatusLabel(status)).toBeTruthy();
      expect(utils.getQuotationStatusBadgeClasses(status)).toBeTruthy();
    }
    expect(utils.normalizeQuotationStatus("pending approval")).toBe(
      "PENDING_APPROVAL",
    );
    expect(utils.normalizeQuotationStatus("SENT")).toBe("UNKNOWN");
    expect(utils.normalizeQuotationStatus(null)).toBe("UNKNOWN");
    expect(utils.getQuotationStatusLabel("UNKNOWN")).toBe("Unknown status");
    expect(utils.getQuotationStatusBadgeClasses("UNKNOWN")).toBeTruthy();
    expect(
      utils.quotationFilterTabs.some((tab) => String(tab.id) === "SENT"),
    ).toBe(false);
  });
  it.each([
    "javascript:alert(1)",
    "data:text/html,test",
    "https://user:pass@example.com/x",
    null,
    "bad",
  ])("rejects unsafe PDF URL %s", (value) =>
    expect(() => safePdfUrl(value)).toThrow(),
  );
  it.each(["https://example.com/x.pdf", "http://localhost:3000/pdf"])(
    "accepts valid PDF URLs %s",
    (value) => expect(safePdfUrl(value)).toBe(value),
  );
  it("does not treat unrelated conflicts as converted", () => {
    expect(
      utils.isAlreadyConvertedError(
        new ApiError("x", 409, "QUOTATION_PROJECT_MISMATCH"),
      ),
    ).toBe(false);
    expect(
      utils.isAlreadyConvertedError(
        new ApiError("x", 409, "ALREADY_CONVERTED"),
      ),
    ).toBe(true);
    expect(utils.isAlreadyConvertedError(new Error())).toBe(false);
  });
});

describe("Quotation response normalization and errors", () => {
  const raw = {
    id: "q",
    leadId: "l",
    status: "APPROVED",
    totalAmount: "0.30",
    items: [
      {
        id: "i",
        itemName: "x",
        quantity: 3,
        unitPrice: "0.10",
        amount: "0.30",
      },
    ],
    lead: { id: "l", customerName: "Acme", email: "a@b.com", phone: "123" },
    createdAt: "2026-10-12",
  };
  it("supports Decimal strings, nested list shapes, and legacy aliases", () => {
    for (const payload of [
      [raw],
      { items: [raw] },
      { data: { items: [raw] } },
      { data: [raw] },
      { quotations: [raw] },
      { results: [raw] },
    ]) {
      const [q] = utils.normalizeQuotations(payload);
      expect(q.totalAmount).toBe(0.3);
      expect(q.items[0].amount).toBe(0.3);
      expect(q.lead?.customerName).toBe("Acme");
    }
    const q = utils.normalizeQuotationRecord(
      {
        quotation_id: "alias",
        lead_id: "l",
        status: "draft",
        items: [null, { description: "x", qty: "2", price: "1.05" }],
        lead: { name: "Alias" },
      },
      0,
    );
    expect(q.id).toBe("alias");
    expect(q.totalAmount).toBe(2.1);
    expect(utils.normalizeQuotations(null)).toEqual([]);
    expect(utils.normalizeQuotations({})).toEqual([]);
    expect(
      utils.normalizeQuotationRecord(
        { status: "DRAFT", totalAmount: "Infinity", lead: {} },
        0,
      ).totalAmount,
    ).toBe(0);
    expect(
      utils.normalizeQuotationRecord({ lead: "bad", items: null }, 0).lead,
    ).toBeUndefined();
    expect(
      utils.normalizeQuotationRecord({ items: [{}] }, 0).items,
    ).toHaveLength(1);
    expect(utils.normalizeQuotations([null, raw])).toHaveLength(1);
  });
  it("formats dates and preserves invalid date strings", () => {
    expect(utils.formatDate("bad")).toBe("bad");
    expect(utils.formatDate("2026-10-12")).toContain("2026");
  });
  it("filters all supported local fields and clamps pages", () => {
    const q = utils.normalizeQuotationRecord(
      { ...raw, notes: "Special", lead: { customerName: "Acme" } },
      0,
    );
    for (const term of ["", "q", "l", "Acme", "Special"])
      expect(utils.filterQuotationsBySearch([q], term)).toHaveLength(1);
    expect(utils.filterQuotationsBySearch([q], "missing")).toEqual([]);
    expect(utils.paginateQuotations([q], 99).page).toBe(1);
    expect(utils.paginateQuotations([], 0).startIndex).toBe(0);
  });
  it("maps domain errors and masks server/network details", () => {
    for (const code of [
      "INVALID_STATUS_TRANSITION",
      "QUOTATION_LOCKED",
      "QUOTATION_REJECTED",
      "ALREADY_CONVERTED",
      "VALIDATION_ERROR",
      "LEAD_NOT_FOUND",
      "OTHER",
    ])
      expect(
        utils.getQuotationErrorMessage(new ApiError("Safe detail", 400, code)),
      ).toBeTruthy();
    expect(
      utils.getQuotationErrorMessage(new ApiError("secret", 502)),
    ).not.toContain("secret");
    expect(utils.getQuotationErrorMessage(new Error("Safe error"))).toBe(
      "Safe error",
    );
    expect(utils.getQuotationErrorMessage(null)).toContain("unexpected");
    expect(utils.isQuotationUnavailableError(new Error())).toBe(false);
    for (const status of [404, 405, 501, 503])
      expect(utils.isQuotationUnavailableError(new ApiError("x", status))).toBe(
        true,
      );
    expect(
      utils.isQuotationUnavailableError(
        new ApiError("x", 400, "NETWORK_ERROR"),
      ),
    ).toBe(true);
    expect(
      utils.isQuotationUnavailableError(
        new ApiError("x", 400, "VALIDATION_ERROR"),
      ),
    ).toBe(false);
  });
});
