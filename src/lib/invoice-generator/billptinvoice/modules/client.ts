import { API_CONTATOS, BILL_API_TOKEN, urlSafe } from "./utils";

export async function getClientId(
  billingAddress: any,
  userEmail: string | null | undefined,
  user: { id: string; email: string } | null | undefined
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

  const createOrUpdateUserUrl = `https://app.bill.pt/api/1.0/contatos${
    clientId === "" ? "" : "/" + clientId
  }?api_token=${BILL_API_TOKEN}&nome=${clientName}&pais=${country}${
    nif !== "" ? "&nif=" + nif : ""
  }&email=${clientEmail}&morada=${address}${
    postalCode !== "" ? "&codigo_postal=" + postalCode : ""
  }&cidade=${city}${
    phone !== "" ? "&telefone_contacto=" + phone : ""
  }&lingua_padrao_documentos=${lingua_documentos}`;

  await fetch(createOrUpdateUserUrl, {
    method: clientId === "" ? "POST" : "PATCH",
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
