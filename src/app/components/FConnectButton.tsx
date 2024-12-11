import { ConnectKitButton } from "connectkit";
import { FButton } from "./FButton";

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