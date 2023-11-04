import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Button, Input, Text } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useEffect, useState } from "react";

const AddToSaleorForm = () => (
  <Box
    as={"form"}
    display={"flex"}
    alignItems={"center"}
    gap={4}
    onSubmit={(event) => {
      event.preventDefault();

      const saleorUrl = new FormData(event.currentTarget as HTMLFormElement).get("saleor-url");
      const manifestUrl = new URL("/api/manifest", window.location.origin);
      const redirectUrl = new URL(
        `/dashboard/apps/install?manifestUrl=${manifestUrl}`,
        saleorUrl as string
      ).href;

      window.open(redirectUrl, "_blank");
    }}
  >
    <Input type="url" required label="Saleor URL" name="saleor-url" />
    <Button type="submit">Add to Saleor</Button>
  </Box>
);

/**
 * This is page publicly accessible from your app.
 */
const IndexPage: NextPage = () => {
  const { appBridgeState, appBridge } = useAppBridge();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLocalHost = global.location.href.includes("localhost");

  return (
    <Box padding={8}>
      <Text variant={"hero"}>Bill.pt Invoicing App</Text>
      <Text as={"p"} marginY={4}>
        Saleor App Template is a minimalistic boilerplate that provides a working example of a
        Saleor app.
      </Text>
      <Button
        variant={"secondary"}
        onClick={() => {
          appBridge?.dispatch({
            type: "notification",
            payload: {
              status: "success",
              title: "You rock!",
              text: "This notification was triggered from Saleor App",
              actionId: "message-from-app",
            },
          });
        }}
      >
        Trigger notification 📤
      </Button>

      {/* TODO: Show latest invoices */}
      {/* TODO: Set/unset terminado flag */}
      {/* TODO: Set BILL_API_TOKEN */}

      {mounted && !isLocalHost && !appBridgeState?.ready && (
        <>
          <Text marginBottom={4} as={"p"}>
            Install this app in your Dashboard and get extra powers!
          </Text>
          <AddToSaleorForm />
        </>
      )}
    </Box>
  );
};

export default IndexPage;
