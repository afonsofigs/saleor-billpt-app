import { OrderPayloadFragment } from "../../../../generated/graphql";
import { InvoiceGenerator } from "../billpt-invoice-generator";
import { getClientId } from "./modules/client";
import { createInvoice, downloadInvoice } from "./modules/invoice";
import { getProductURLString } from "./modules/product";
import { TERMINADO } from "./modules/utils";

export class BillptInvoiceGenerator implements InvoiceGenerator {
  constructor() {}
  async generate(input: { order: OrderPayloadFragment; filename: string }) {
    const { order, filename } = input;

    //Create products full string

    // Add shipping to products lines if exists
    if (order.shippingMethodName) {
      const shippingName = order.shippingMethodName;
      const shippingId =
        order.shippingMethods.find((sm) => sm.name === order.shippingMethodName)?.id ??
        shippingName;
      order.lines.push({
        productName: shippingName,
        productVariantId: shippingId,
        variantName: shippingId,
        taxRate: 23,
        quantity: 1,
        unitPrice: order.shippingPrice,
        totalPrice: order.shippingPrice,
        undiscountedUnitPrice: order.shippingPrice,
      });
    }

    let allProdsString: string = "";
    for (let i = 0; i < order.lines.length; i++) {
      const prod = order.lines[i];
      allProdsString += await getProductURLString(prod, i);
    }

    console.log("All Products URL: " + allProdsString);

    // Get and create user
    const clientId = await getClientId(order.billingAddress, order.userEmail, order.user);

    // Create Invoice
    const { invoiceId, token_download } = await createInvoice(clientId, allProdsString);

    // Download invoice
    if (TERMINADO === "1") {
      await downloadInvoice(filename, invoiceId, token_download);
    }

    return;
  }
}
