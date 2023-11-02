import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import {
  OrderConfirmed,
  UntypedOrderConfirmedSubscribedDocument,
} from "../../../../generated/graphql";
import { createClient } from "../../../lib/create-graphq-client";
import { InvoiceCreateNotifier } from "../../../lib/invoice-create-notifier/invoice-create-notifier";
import { hashInvoiceFilename } from "../../../lib/invoice-file-name/hash-invoice-filename";
import { resolveTempPdfFileLocation } from "../../../lib/invoice-file-name/resolve-temp-pdf-file-location";
import { BillptInvoiceGenerator } from "../../../lib/invoice-generator/billptinvoice/billpt-invoice-generator";
import { SaleorInvoiceUploader } from "../../../lib/invoice-uploader/saleor-invoice-uploader";
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
export default orderConfirmedWebhook.createHandler(async (req, res, ctx) => {
  const {
    /**
     * Access payload from Saleor - defined above
     */
    payload,
    /**
     * Saleor event that triggers the webhook (here - ORDER_CONFIRMED)
     */
    event,
    /**
     * App's URL
     */
    baseUrl,
    /**
     * Auth data (from APL) - contains token and saleorApiUrl that can be used to construct graphQL client
     */
    authData,
  } = ctx;

  /**
   * Perform logic based on Saleor Event payload
   */
  console.log(`Order was confirmed for customer: ${payload.order?.userEmail}`);

  /**
   * Create GraphQL client to interact with Saleor API.
   */
  const client = createClient(authData.saleorApiUrl, async () => ({ token: authData.token }));
  /**
   * Now you can fetch additional data using urql.
   * https://formidable.com/open-source/urql/docs/api/core/#clientquery
   */

  // const data = await client.query().toPromise()

  try {
    const order = payload.order;
    if (!order) throw Error("No order object from webhook payload");
    const hashedInvoiceName = hashInvoiceFilename("Invoice", order.id);

    const hashedInvoiceFileName = `${hashedInvoiceName}.pdf`;
    const tempPdfLocation = await resolveTempPdfFileLocation(hashedInvoiceFileName);

    console.log({ tempPdfLocation });

    await new BillptInvoiceGenerator().generate({
      order,
      filename: tempPdfLocation,
    });

    const uploader = new SaleorInvoiceUploader(client);

    const uploadedFileUrl = await uploader.upload(tempPdfLocation, `${hashedInvoiceFileName}.pdf`);

    await new InvoiceCreateNotifier(client).notifyInvoiceCreated(
      order.id,
      hashedInvoiceFileName,
      uploadedFileUrl
    );
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: (e as any)?.message ?? "Error",
    });
  }

  /**
   * Inform Saleor that webhook was delivered properly.
   */
  return res.status(200).end();
});

/**
 * Disable body parser for this endpoint, so signature can be verified
 */
export const config = {
  api: {
    bodyParser: false,
  },
};
