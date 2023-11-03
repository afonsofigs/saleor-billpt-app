import { OrderPayloadFragment } from "../../../../../generated/graphql";
import { API_CONTATOS, API_UPDATE_CONTATO, urlSafe } from "./utils";

export async function getClientId(
  billingAddress: OrderPayloadFragment["billingAddress"],
  userEmail: OrderPayloadFragment["userEmail"],
  user: OrderPayloadFragment["user"]
) {
  const clientEmail = userEmail ?? user?.email ?? "clientsememail@error.com";
  const findUserUrl = `${API_CONTATOS}&pesquisa[email]=${clientEmail}`;
  let clientId = "";

  await fetch(findUserUrl)
    .then((response) => response.json())
    .then((body) => {
      console.log("Fetch find client");
      console.log(body);
      if (body.total > 0) {
        clientId = body.data[0].id;
        //TODO: Check for need to update user info, right now always updates
      }
    });

  // Create client name
  let clientName: string = "Cliente Sem Nome";

  if (billingAddress && billingAddress.companyName !== "") {
    clientName = billingAddress.companyName;
    if (billingAddress.firstName !== "" || billingAddress.lastName !== "") {
      clientName += ` - ${billingAddress.firstName} ${billingAddress.lastName}`;
    }
  } else if (
    billingAddress &&
    (billingAddress.firstName !== "" || billingAddress.lastName !== "")
  ) {
    clientName = `${billingAddress.firstName} ${billingAddress.lastName}`;
  }
  clientName = urlSafe(clientName, 150);

  const country = billingAddress?.country.code;
  const nifMetafield = billingAddress?.metafields["NIF"] ?? "";
  const nif = urlSafe(nifMetafield !== "" ? nifMetafield : "999999990", 15);
  // Create client address
  let address = billingAddress?.streetAddress1;

  if (billingAddress?.streetAddress2 && billingAddress?.streetAddress2 !== "")
    address += `, ${billingAddress?.streetAddress2}`;

  address = urlSafe(address ?? "Sem Morada", 100);

  const postalCode = urlSafe(billingAddress?.postalCode ?? "", 15);
  const city = urlSafe(billingAddress?.city ?? "", 50);
  const phone = urlSafe(billingAddress?.phone ?? "", 50);
  const lingua_documentos: "pt" | "en" | "fr" = "pt";

  const newClient: boolean = clientId === "";
  let createOrUpdateUserUrl: string = newClient ? API_CONTATOS : API_UPDATE_CONTATO(clientId);
  createOrUpdateUserUrl += `&nome=${clientName}`;
  createOrUpdateUserUrl += `&pais=${country}$`;
  createOrUpdateUserUrl += `"&nif=${nif}`;
  createOrUpdateUserUrl += `&email=${clientEmail}`;
  createOrUpdateUserUrl += `&morada=${address}`;
  createOrUpdateUserUrl += `&codigo_postal=${postalCode}`;
  createOrUpdateUserUrl += `&cidade=${city}`;
  createOrUpdateUserUrl += `&telefone_contacto=${phone}`;
  createOrUpdateUserUrl += `&lingua_padrao_documentos=${lingua_documentos}`;

  await fetch(createOrUpdateUserUrl, {
    method: newClient ? "POST" : "PATCH",
  })
    .then((response) => response.json())
    .then((body) => {
      console.log("Fetch create/update client");
      console.log(body);
      clientId = body.id;
    });

  console.log("Client ID: " + clientId);

  return clientId;
}
