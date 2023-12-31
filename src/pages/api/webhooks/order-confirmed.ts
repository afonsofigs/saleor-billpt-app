import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import {
  OrderConfirmed,
  UntypedOrderConfirmedSubscribedDocument,
} from "../../../../generated/graphql";
import { invoiceHandler } from "../../../lib/invoice-generator/billpt-invoice-generator";
import { saleorApp } from "../../../saleor-app";

/**
 * Create abstract Webhook. It decorates handler and performs security checks under the hood.
 *
 * orderConfirmedWebhook.getWebhookManifest() must be called in api/manifest too!
 */
export const orderConfirmedWebhook = new SaleorAsyncWebhook<OrderConfirmed>({
  name: "Order Confirmed in Saleor",
  webhookPath: "api/webhooks/order-confirmed",
  event: "ORDER_CONFIRMED",
  apl: saleorApp.apl,
  query: UntypedOrderConfirmedSubscribedDocument,
});

/**
 * Export decorated Next.js handler, which adds extra context
 */
export default orderConfirmedWebhook.createHandler(invoiceHandler);

/**
 * Disable body parser for this endpoint, so signature can be verified
 */
export const config = {
  api: {
    bodyParser: false,
  },
};
