import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import {
  InvoiceRequested,
  UntypedInvoiceRequestedSubscribedDocument,
} from "../../../../generated/graphql";
import { invoiceHandler } from "../../../lib/invoice-generator/billpt-invoice-generator";
import { saleorApp } from "../../../saleor-app";

/**
 * Create abstract Webhook. It decorates handler and performs security checks under the hood.
 *
 * invoiceRequestedWebhook.getWebhookManifest() must be called in api/manifest too!
 */
export const invoiceRequestedWebhook = new SaleorAsyncWebhook<InvoiceRequested>({
  name: "Invoice requested in Saleor",
  webhookPath: "api/webhooks/invoice-requested",
  event: "INVOICE_REQUESTED",
  apl: saleorApp.apl,
  query: UntypedInvoiceRequestedSubscribedDocument,
});

/**
 * Export decorated Next.js handler, which adds extra context
 */
export default invoiceRequestedWebhook.createHandler(invoiceHandler);

/**
 * Disable body parser for this endpoint, so signature can be verified
 */
export const config = {
  api: {
    bodyParser: false,
  },
};
