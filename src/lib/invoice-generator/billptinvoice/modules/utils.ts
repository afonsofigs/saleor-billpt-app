export function urlSafe(text: string, sliceAt: number = text.length) {
  return text.replace(/[|=@!^&\/\\#()$~%.'":*?<>{}\[\]]/g, "").slice(0, sliceAt);
}
export const BILL_API_TOKEN = process.env.BILL_API_TOKEN;
export const TERMINADO: "1" | "0" = process.env.DRAFT_INVOICES === "true" ? "0" : "1";

export const APP_URL = "https://app.bill.pt/";
export const API_URL = `${APP_URL}api/1.0/`;

export const API_ITEMS = `${API_URL}items?api_token=${BILL_API_TOKEN}`;
export const API_CONTATOS = `${API_URL}contatos?api_token=${BILL_API_TOKEN}`;
export const API_UPDATE_CONTATO = (clientId: string) =>
  `${API_URL}contatos/${clientId}?api_token=${BILL_API_TOKEN}`;
export const API_DOCS = `${API_URL}documentos?api_token=${BILL_API_TOKEN}`;
export const APP_DOCS_DOWNLOAD = `${APP_URL}documentos/download/`;
