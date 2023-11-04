import { OrderPayloadFragment } from "../../../../../generated/graphql";
import { API_CONTATOS, API_UPDATE_CONTATO, urlSafe } from "./utils";

export async function getClientId(
  billingAddress: OrderPayloadFragment["billingAddress"],
  userEmail: OrderPayloadFragment["userEmail"],
  user: OrderPayloadFragment["user"]
) {
  if (!billingAddress)
    throw new Error("billingAddress is null or undefined, while getting client id");
  if (!user) throw new Error("user is null or undefined, while getting client id");

  const clientEmail: string = userEmail ?? user.email;
  const findUserUrl: string = `${API_CONTATOS}&pesquisa[email]=${clientEmail}`;
  let clientId: string = "";

  await fetch(findUserUrl)
    .then((response) => response.json())
    .then((body) => {
      console.log("Fetch find client");
      console.log(body);
      if (body.total > 0) {
        if (body.error) throw Error("Error while fetching client: " + JSON.stringify(body.error));
        clientId = body.data[0].id;
        //TODO: Check for need to update user info?, right now always updates
      }
    });

  // Create client name
  let clientName: string;
  if (billingAddress.companyName !== "") {
    clientName = billingAddress.companyName;
    if (billingAddress.firstName !== "" || billingAddress.lastName !== "") {
      clientName += ` - ${billingAddress.firstName} ${billingAddress.lastName}`;
    }
  } else if (billingAddress.firstName !== "" || billingAddress.lastName !== "") {
    clientName = `${billingAddress.firstName} ${billingAddress.lastName}`;
  } else if (user.firstName !== "" || user.lastName !== "") {
    clientName = `${user.firstName} ${user.lastName}`;
  } else {
    clientName = "Cliente SemNome";
  }
  clientName = urlSafe(clientName, 150);

  let country: string = billingAddress.country.code;
  const nifMetafield = billingAddress.metafields["NIF"] ?? "";
  let nif: string = urlSafe(nifMetafield !== "" ? nifMetafield : "999999990", 15);

  // Create client address
  let address: string;
  if (billingAddress.streetAddress1 !== "" && billingAddress.streetAddress2 !== "")
    address = `${billingAddress.streetAddress1}, ${billingAddress.streetAddress2}`;
  else if (billingAddress.streetAddress1 !== "" || billingAddress.streetAddress2 !== "")
    address = billingAddress.streetAddress1 + billingAddress.streetAddress2;
  else address = "Sem Morada";
  address = urlSafe(address, 100);

  let postalCode: string = urlSafe(billingAddress.postalCode, 15);
  const city: string = urlSafe(billingAddress.city, 50);
  const phone: string | null = billingAddress.phone ? urlSafe(billingAddress.phone, 50) : null;
  const lingua_documentos: "pt" | "en" | "fr" = "pt";

  const newClient: boolean = clientId === "";

  let tryAgain: boolean = true;
  while (tryAgain) {
    tryAgain = false;
    let createOrUpdateUserUrl: string = newClient ? API_CONTATOS : API_UPDATE_CONTATO(clientId);
    createOrUpdateUserUrl += `&nome=${clientName}`;
    createOrUpdateUserUrl += `&pais=${country}`;
    createOrUpdateUserUrl += `&nif=${nif}`;
    createOrUpdateUserUrl += `&email=${clientEmail}`;
    createOrUpdateUserUrl += `&morada=${address}`;
    createOrUpdateUserUrl += `&codigo_postal=${postalCode}`;
    createOrUpdateUserUrl += `&cidade=${city}`;
    if (phone) createOrUpdateUserUrl += `&telefone_contacto=${phone}`;
    createOrUpdateUserUrl += `&lingua_padrao_documentos=${lingua_documentos}`;

    await fetch(createOrUpdateUserUrl, {
      method: newClient ? "POST" : "PATCH",
    })
      .then((response) => response.json())
      .then((body) => {
        console.log("Fetch create/update client");
        console.log(body);
        // Error handling
        if (body.error) {
          switch (body.error[0] satisfies string) {
            case "206":
              // Nif invalid
              nif = "999999990";
              break;
            case "215":
              // Postal code invalid
              postalCode = "";
              break;
            case "Undefined index: pais":
              country = "PT";
              break;
            default:
              throw new Error("Error while creating/updating client: " + JSON.parse(body.error));
          }
          tryAgain = true;
        }

        clientId = body.id;
      });
  }
  console.log("Client ID: " + clientId);

  return clientId;
}
