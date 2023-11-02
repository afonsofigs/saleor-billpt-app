import fs from "fs";
import { OrderPayloadFragment } from "../../../../generated/graphql";
import { InvoiceGenerator } from "../billpt-invoice-generator";

export class BillptInvoiceGenerator implements InvoiceGenerator {
  constructor() {}
  async generate(input: { order: OrderPayloadFragment; filename: string }) {
    const { order, filename } = input;
    const BILL_API_TOKEN = process.env.BILL_API_TOKEN;
    const TERMINADO: "1" | "0" = process.env.DRAFT_INVOICES === "true" ? "0" : "1";

    function urlSafe(text: string, sliceAt: number = text.length) {
      return text.replace(/[|=@!^&\/\\#()$~%.'":*?<>{}\[\]]/g, "").slice(0, sliceAt);
    }

    //Get and create products and full string
    let allProdsString = "";
    //default was: &produtos[0][item_id]=${prodId}&produtos[0][nome]=Saroto Tinto 2018&produtos[0][quantidade]=1&produtos[0][preco_unitario]=40.00&produtos[0][imposto]=13

    // Add shipping to products lines -> order.shippingMethodName, order.shippingPrice.gross.amount
    const shippingName = order.shippingMethodName ?? "Shipping";
    const shippingId =
      order.shippingMethods.find((sm) => sm.name === order.shippingMethodName)?.id ?? shippingName;

    order.lines.push({
      productName: shippingName,
      productVariantId: shippingId,
      variantName: shippingId,
      taxRate: 23,
      quantity: 1,
      unitPrice: order.shippingPrice,
      totalPrice: order.shippingPrice,
    });

    for (let i = 0; i < order.lines.length; i++) {
      const prod = order.lines[i];
      const prodName = urlSafe(prod.productName + " - " + prod.variantName, 200);
      const iva = prod.taxRate === 13 ? "13577" : "13576"; //13% -> 13577; 23% -> 13576; 0->0
      const price = prod.unitPrice.net.amount; //preco unitario sem iva e com descontos
      const prodSaleorId: string = urlSafe(prod.productVariantId ?? prodName, 100);
      const findProdUrl = `https://app.bill.pt/api/1.0/items?api_token=${BILL_API_TOKEN}&pesquisa[texto][codigo_barras]=${prodSaleorId}`;
      let prodId = "";

      await fetch(findProdUrl)
        .then((response) => response.json())
        .then((body) => {
          console.log("Fetch find product");
          console.log(body);
          if (body.total > 0) prodId = body.data[0].id;
        });

      if (prodId === "") {
        const createProdUrl = `https://app.bill.pt/api/1.0/items?api_token=${BILL_API_TOKEN}&descricao=${prodName}&unidade_medida_id=16094&ProductCategory=M&movimenta_stock=0&servico=0&iva_compra=0&imposto_id=${iva}&codigo_barras=${prodSaleorId}&precos[0][preco_nome]=Price1&precos[0][preco_sem_iva]=${price}`;

        await fetch(createProdUrl, { method: "POST" })
          .then((response) => response.json())
          .then((body) => {
            prodId = body.id;
          });
      }

      console.log("Product ID: " + prodId);

      allProdsString += `&produtos[${i}][item_id]=${prodId}&produtos[${i}][nome]=${prodName}&produtos[${i}][quantidade]=${prod.quantity}&produtos[${i}][preco_unitario]=${price}&produtos[${i}][imposto_id]=${iva}`;
    }

    console.log("All Products URL: " + allProdsString);

    // Get and create user
    const clientEmail = order.userEmail ?? order.user?.email ?? "clientsememail@error.com";
    const findUserUrl = `https://app.bill.pt/api/1.0/contatos?api_token=${BILL_API_TOKEN}&pesquisa[email]=${clientEmail}`;
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

    if (order.billingAddress && order.billingAddress.companyName !== "") {
      clientName = order.billingAddress.companyName;
      if (order.billingAddress.firstName !== "" || order.billingAddress.lastName !== "") {
        clientName += ` - ${order.billingAddress.firstName} ${order.billingAddress.lastName}`;
      }
    } else if (
      order.billingAddress &&
      (order.billingAddress.firstName !== "" || order.billingAddress.lastName !== "")
    ) {
      clientName = `${order.billingAddress.firstName} ${order.billingAddress.lastName}`;
    }
    clientName = urlSafe(clientName, 150);

    const country = order.billingAddress?.country.code;
    const nifMetafield = order.billingAddress?.metafields["NIF"] ?? "";
    const nif = urlSafe(nifMetafield !== "" ? nifMetafield : "999999990", 15);
    // Create client address
    let address = order.billingAddress?.streetAddress1;

    if (order.billingAddress?.streetAddress2 && order.billingAddress?.streetAddress2 !== "")
      address += `, ${order.billingAddress?.streetAddress2}`;

    address = urlSafe(address ?? "Sem Morada", 100);

    const postalCode = urlSafe(order.billingAddress?.postalCode ?? "", 15);
    const city = urlSafe(order.billingAddress?.city ?? "", 50);
    const phone = urlSafe(order.billingAddress?.phone ?? "", 50);
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

    // Create Invoice
    const createInvoiceUrl = `https://app.bill.pt/api/1.0/documentos?api_token=${BILL_API_TOKEN}&tipificacao=FR&contato_id=${clientId}${allProdsString}&terminado=${TERMINADO}`;
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

    // Download invoice
    if (TERMINADO === "1") {
      const downloadInvoiceUrl = `https://app.bill.pt/documentos/download/${invoiceId}/${token_download}`;

      await fetch(downloadInvoiceUrl)
        .then((res) => res.arrayBuffer())
        .then((pdfb) => Buffer.from(pdfb))
        .then((bpdf) => fs.writeFileSync(filename, bpdf, "binary"));
    }

    return;
  }
}
