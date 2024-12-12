import { ConnectKitButton } from "connectkit";
import { FButton } from "./FButton";
import { Button } from "~/components/ui/button";

export const FConnectButton = () => {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, hide, address, ensName, chain }) => {
        return (
          <FButton onClick={show} primary={!isConnected} selected>
            {isConnected ? address?.slice(0,5) : "Connect"}
          </FButton>
        );
      }}
    </ConnectKitButton.Custom>
  );
};

export const FConnectButtonLarge = () => (
  <ConnectKitButton.Custom>
    {({ isConnected, isConnecting, show, hide, address, ensName, chain }) => {
      return (
        <Button onClick={show} className="w-full">
          {isConnected ? address?.slice(0,5) : "Connect Wallet"}
        </Button>
      );
    }}
  </ConnectKitButton.Custom>
)