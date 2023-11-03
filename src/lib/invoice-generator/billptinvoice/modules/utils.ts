export function urlSafe(text: string, sliceAt: number = text.length) {
  return text.replace(/[|=@!^&\/\\#()$~%.'":*?<>{}\[\]]/g, "").slice(0, sliceAt);
}
export const BILL_API_TOKEN = process.env.BILL_API_TOKEN;
export const TERMINADO: "1" | "0" = process.env.DRAFT_INVOICES === "true" ? "0" : "1";

export const API_ITEMS = `https://app.bill.pt/api/1.0/items?api_token=${BILL_API_TOKEN}`;
export const API_CONTATOS = `https://app.bill.pt/api/1.0/contatos?api_token=${BILL_API_TOKEN}`;
export const API_DOCS = `https://app.bill.pt/api/1.0/documentos?api_token=${BILL_API_TOKEN}`;
export const APP_DOCS_DOWNLOAD = `https://app.bill.pt/documentos/download/`;
