import fs from "fs";
import { API_DOCS, APP_DOCS_DOWNLOAD, TERMINADO } from "./utils";

export async function createInvoice(clientId: string, allProdsString: string) {
  let createInvoiceUrl = API_DOCS;
  createInvoiceUrl += `&tipificacao=FR`;
  createInvoiceUrl += `&contato_id=${clientId}${allProdsString}`;
  createInvoiceUrl += `&terminado=${TERMINADO}`;

  let invoiceId = "";
  let token_download = "";

  await fetch(createInvoiceUrl, { method: "POST" })
    .then((response) => response.json())
    .then((body) => {
      console.log("Fetch create invoice");
      console.log(body);
      invoiceId = body.id;
      token_download = body.token_download;
    });

  console.log("Invoice ID: " + invoiceId);
  console.log("Token dowload: " + token_download);

  return { invoiceId, token_download };
}

export async function downloadInvoice(filename: string, invoiceId: string, token_download: string) {
  const downloadInvoiceUrl = `${APP_DOCS_DOWNLOAD}${invoiceId}/${token_download}`;

  await fetch(downloadInvoiceUrl)
    .then((res) => res.arrayBuffer())
    .then((pdfb) => Buffer.from(pdfb))
    .then((bpdf) => fs.writeFileSync(filename, bpdf, "binary"));
}
