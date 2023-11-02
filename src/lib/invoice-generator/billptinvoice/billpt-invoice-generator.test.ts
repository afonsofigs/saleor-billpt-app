import { join } from "path";
import { describe, it } from "vitest";
import { BillptInvoiceGenerator } from "./billpt-invoice-generator";
import { mockOrder } from "./mock-billpt-order";

const dirToSet = process.env.TEMP_PDF_STORAGE_DIR as string;
const filePath = join(dirToSet, "test-invoice.pdf");

describe("BillptInvoiceGenerator", () => {
  it.runIf(process.env.CI !== "true")("Generates BILLPT invoice file from Order", async () => {
    const instance = new BillptInvoiceGenerator();

    await instance.generate({
      order: mockOrder,
      filename: filePath,
    });

    // TODO: return expect(readFile(filePath)).resolves.toBeDefined();
  });
});
