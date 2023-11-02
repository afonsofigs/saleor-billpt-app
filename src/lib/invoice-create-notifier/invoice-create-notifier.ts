import { Client, gql } from "urql";
import { InvoiceCreateDocument } from "../../../generated/graphql";

gql`
  mutation InvoiceCreate($orderId: ID!, $invoiceInput: InvoiceCreateInput!) {
    invoiceCreate(input: $invoiceInput, orderId: $orderId) {
      errors {
        message
      }
      invoice {
        id
      }
    }
  }
`;

export class InvoiceCreateNotifier {
  constructor(private client: Client) {}

  async notifyInvoiceCreated(orderId: string, invoiceNumber: string, invoiceUrl: string) {
    console.log("Will notify Saleor with invoiceCreate mutation");

    const result_1 = await this.client
      .mutation(InvoiceCreateDocument, {
        orderId,
        invoiceInput: {
          url: invoiceUrl,
          number: invoiceNumber,
        },
      })
      .toPromise();
    console.log("invoiceCreate finished");

    if (result_1.error) {
      throw new Error(result_1.error.message);
    }
  }
}
