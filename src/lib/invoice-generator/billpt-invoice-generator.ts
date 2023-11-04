import { NextWebhookApiHandler } from "@saleor/app-sdk/handlers/next";
import { InvoiceRequested, OrderConfirmed, OrderPayloadFragment } from "../../../generated/graphql";
import { createClient } from "../create-graphq-client";
import { InvoiceCreateNotifier } from "../invoice-create-notifier/invoice-create-notifier";
import { hashInvoiceFilename } from "../invoice-file-name/hash-invoice-filename";
import { resolveTempPdfFileLocation } from "../invoice-file-name/resolve-temp-pdf-file-location";
import { SaleorInvoiceUploader } from "../invoice-uploader/saleor-invoice-uploader";
import { BillptInvoiceGenerator } from "./billptinvoice/billpt-invoice-generator";
import { TERMINADO } from "./billptinvoice/modules/utils";

export interface InvoiceGenerator {
  generate(input: { order: OrderPayloadFragment; filename: string }): Promise<void>;
}

export const invoiceHandler: NextWebhookApiHandler<InvoiceRequested | OrderConfirmed, {}> = async (
  req,
  res,
  ctx
) => {
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

    if (TERMINADO === "1") {
      // Upload invoice to saleor

      const uploader = new SaleorInvoiceUploader(client);

      const uploadedFileUrl = await uploader.upload(
        tempPdfLocation,
        `${hashedInvoiceFileName}.pdf`
      );

      await new InvoiceCreateNotifier(client).notifyInvoiceCreated(
        order.id,
        hashedInvoiceFileName,
        uploadedFileUrl
      );
    }
  } catch (e) {
    console.error(e);
    return res.status(200).json({
      error: (e as any)?.message ?? "Error",
    });
  }

  /**
   * Inform Saleor that webhook was delivered properly.
   */
  return res.status(200).end();
};
