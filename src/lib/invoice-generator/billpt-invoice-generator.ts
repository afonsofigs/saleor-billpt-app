import { OrderPayloadFragment } from "../../../generated/graphql";

export interface InvoiceGenerator {
  generate(input: { order: OrderPayloadFragment; filename: string }): Promise<void>;
}
