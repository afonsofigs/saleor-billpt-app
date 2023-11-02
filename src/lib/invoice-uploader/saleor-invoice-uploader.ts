import { readFile } from "fs/promises";
import { Client, gql } from "urql";
import { FileUploadMutation } from "../../../generated/graphql";
import { InvoiceUploader } from "./invoice-uploader";
/**
 * Polyfill file because Node doesn't have it yet
 * https://github.com/nodejs/node/commit/916af4ef2d63fe936a369bcf87ee4f69ec7c67ce
 *
 * Use File instead of Blob so Saleor can understand name
 */
import { File } from "@web-std/file";

const fileUpload = gql`
  mutation FileUpload($file: Upload!) {
    fileUpload(file: $file) {
      errors {
        message
      }
      uploadedFile {
        url
      }
    }
  }
`;

export class SaleorInvoiceUploader implements InvoiceUploader {
  constructor(private client: Client) {}

  async upload(filePath: string, asName: string): Promise<string> {
    console.log("Will upload blob to Saleor");

    const file = await readFile(filePath);
    const blob = new File([file], asName, { type: "application/pdf" });
    const r = await this.client
      .mutation<FileUploadMutation>(fileUpload, {
        file: blob,
      })
      .toPromise();
    if (r.data?.fileUpload?.uploadedFile?.url) {
      console.log("Saleor returned response after uploading blob");

      return r.data.fileUpload.uploadedFile.url;
    } else {
      console.error("Uploading blob failed");

      throw new Error(r.error?.message);
    }
  }
}
