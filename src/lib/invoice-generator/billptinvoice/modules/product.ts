import { API_ITEMS, urlSafe } from "./utils";

export async function getProductURLString(prod: any, idx: number = 0) {
  const prodName = urlSafe(prod.productName + " - " + prod.variantName, 200);
  const iva = prod.taxRate === 13 ? "13577" : "13576"; //13% -> 13577; 23% -> 13576; 0->0
  const price = prod.unitPrice.net.amount; //preco unitario sem iva e com descontos
  const prodSaleorId: string = urlSafe(prod.productVariantId ?? prodName, 100);
  const findProdUrl = `${API_ITEMS}&pesquisa[texto][codigo_barras]=${prodSaleorId}`;
  let prodId = "";

  await fetch(findProdUrl)
    .then((response) => response.json())
    .then((body) => {
      console.log("Fetch find product");
      console.log(body);
      if (body.total > 0) prodId = body.data[0].id;
    });

  if (prodId === "") {
    const createProdUrl = `${API_ITEMS}&descricao=${prodName}&unidade_medida_id=16094&ProductCategory=M&movimenta_stock=0&servico=0&iva_compra=0&imposto_id=${iva}&codigo_barras=${prodSaleorId}&precos[0][preco_nome]=Price1&precos[0][preco_sem_iva]=${price}`;

    await fetch(createProdUrl, { method: "POST" })
      .then((response) => response.json())
      .then((body) => {
        prodId = body.id;
      });
  }

  console.log("Product ID: " + prodId);

  //default was: &produtos[0][item_id]=${prodId}&produtos[0][nome]=Saroto Tinto 2018&produtos[0][quantidade]=1&produtos[0][preco_unitario]=40.00&produtos[0][imposto]=13
  return `&produtos[${idx}][item_id]=${prodId}&produtos[${idx}][nome]=${prodName}&produtos[${idx}][quantidade]=${prod.quantity}&produtos[${idx}][preco_unitario]=${price}&produtos[${idx}][imposto_id]=${iva}`;
}
