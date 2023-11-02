import { OrderPayloadFragment, OrderStatus } from "../../../../generated/graphql";

export const mockOrder: OrderPayloadFragment = {
  id: "T3JkZXI6NDJlZGM4OWMtZWFiNC00YTA2LWFmNzktNzM3MzU1ZTE3YjU4",
  shippingPrice: {
    currency: "EUR",
    gross: {
      amount: 8,
      currency: "EUR",
    },
    net: {
      amount: 8,
      currency: "EUR",
    },
    tax: {
      amount: 0,
      currency: "EUR",
    },
  },
  shippingMethodName: "CTT Portugal",
  shippingMethods: [
    {
      id: "U2hpcHBpbmdNZXRob2Q6Mw==",
      name: "CTT Portugal",
    },
  ],
  number: "16",
  userEmail: "email@teste.com",
  user: {
    id: "VXNlcjoxOA==",
    email: "email@teste.com",
    firstName: "FirstName",
    lastName: "LastName",
  },
  billingAddress: {
    id: "QWRkcmVzczo1Mw==",
    country: {
      country: "Portugal",
      code: "PT",
    },
    companyName: "companyName",
    cityArea: "cityArea",
    countryArea: "countryArea",
    streetAddress1: "Rua dos Testes",
    streetAddress2: "",
    postalCode: "2830-188",
    phone: "+351910000000",
    firstName: "FirstBillingName",
    lastName: "LastBillingName",
    city: "Lisboa",
    metafields: {
      NIF: "999999990",
    },
  },
  created: "2023-11-01T18:04:53.580210+00:00",
  fulfillments: [],
  status: OrderStatus.Unfulfilled,
  total: {
    currency: "EUR",
    gross: {
      amount: 37.41,
      currency: "EUR",
    },
    net: {
      amount: 31.9,
      currency: "EUR",
    },
    tax: {
      amount: 5.51,
      currency: "EUR",
    },
  },
  channel: {
    slug: "ptstorechannel",
  },
  lines: [
    {
      productVariantId: "UHJvZHVjdFZhcmlhbnQ6OA==",
      productName: "Product 1",
      variantName: "Variant 1",
      taxRate: 0.23,
      quantity: 1,
      unitPrice: {
        currency: "EUR",
        gross: {
          amount: 12.79,
          currency: "EUR",
        },
        net: {
          amount: 10.4,
          currency: "EUR",
        },
        tax: {
          amount: 2.39,
          currency: "EUR",
        },
      },
      totalPrice: {
        currency: "EUR",
        gross: {
          amount: 12.79,
          currency: "EUR",
        },
        net: {
          amount: 10.4,
          currency: "EUR",
        },
        tax: {
          amount: 2.39,
          currency: "EUR",
        },
      },
    },
    {
      productVariantId: "UHJvZHVjdFZhcmlhbnQ6MjM=",
      productName: "Product 2",
      variantName: "Variant 1",
      taxRate: 0.23,
      quantity: 1,
      unitPrice: {
        currency: "EUR",
        gross: {
          amount: 5.54,
          currency: "EUR",
        },
        net: {
          amount: 4.5,
          currency: "EUR",
        },
        tax: {
          amount: 1.04,
          currency: "EUR",
        },
      },
      totalPrice: {
        currency: "EUR",
        gross: {
          amount: 5.54,
          currency: "EUR",
        },
        net: {
          amount: 4.5,
          currency: "EUR",
        },
        tax: {
          amount: 1.04,
          currency: "EUR",
        },
      },
    },
  ],
};
