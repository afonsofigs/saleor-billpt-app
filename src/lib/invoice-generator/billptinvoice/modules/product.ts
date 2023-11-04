import { OrderPayloadFragment } from "../../../../../generated/graphql";
import { API_ITEMS, urlSafe } from "./utils";

export async function getProductURLString(prod: OrderPayloadFragment["lines"][0], idx: number = 0) {
  const prodName = urlSafe(prod.productName + " - " + prod.variantName, 200);

  const iva = (() => {
    //13% -> 13577; 23% -> 13576; 0->0
    switch (prod.taxRate) {
      case 13:
        return "13577";
      case 0:
        return "0";
      default:
        return "13576";
    }
  })();

  let price: number = prod.unitPrice.net.amount; //unit price without vat with discounts
  let discount: "100" | "0" = "0";
  if (price === 0) {
    // Prevent error 271
    price = prod.undiscountedUnitPrice.net.amount;
    discount = "100";
  }

  const prodSaleorId: string = urlSafe(prod.productVariantId ?? prodName, 100);
  const findProdUrl = `${API_ITEMS}&pesquisa[texto][codigo_barras]=${prodSaleorId}`;

  let prodId = "";

  await fetch(findProdUrl)
    .then((response) => response.json())
    .then((body) => {
      console.log("Fetch find product");
      console.log(body);
      if (body.error) throw Error("Error while fetching product: " + JSON.stringify(body.error));
      if (body.total > 0) prodId = body.data[0].id;
    });

  if (prodId === "") {
    let createProdUrl: string = API_ITEMS;
    createProdUrl += `&descricao=${prodName}`;
    createProdUrl += `&unidade_medida_id=16094`;
    createProdUrl += `&ProductCategory=M`;
    createProdUrl += `&movimenta_stock=0`;
    createProdUrl += `&servico=0`;
    createProdUrl += `&iva_compra=0`;
    createProdUrl += `&imposto_id=${iva}`;
    createProdUrl += `&codigo_barras=${prodSaleorId}`;
    createProdUrl += `&precos[0][preco_nome]=Price1`;
    createProdUrl += `&precos[0][preco_sem_iva]=${price}`;
    createProdUrl += `&precos[0][desconto_1]=${discount}`;

    await fetch(createProdUrl, { method: "POST" })
      .then((response) => response.json())
      .then((body) => {
        if (body.error) throw Error("Error while creating produto: " + JSON.stringify(body.error));
        prodId = body.id;
      });
  }

  console.log("Product ID: " + prodId);

  let prodString = `&produtos[${idx}][item_id]=${prodId}`;
  prodString += `&produtos[${idx}][nome]=${prodName}`;
  prodString += `&produtos[${idx}][quantidade]=${prod.quantity}`;
  prodString += `&produtos[${idx}][preco_unitario]=${price}`;
  prodString += `&produtos[${idx}][imposto_id]=${iva}`;

  return prodString;
}
