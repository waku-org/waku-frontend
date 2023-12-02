"use client";
import { Header } from "@/app/components/Header";
import { Keystore } from "@/app/components/Keystore";
import { KeystoreDetails } from "@/app/components/KeystoreDetails";
import { useWallet } from "@/hooks";
import { Status } from "@/components/Status";
import { useStore } from "@/hooks";

export default function KeystorePage() {
  const { onWalletConnect } = useWallet();
  const { appStatus, wallet } = useStore();

  if (typeof window !== "undefined" && !window?.ethereum) {
    return (
      <main className="flex min-h-screen flex-col p-6 font-mono max-w-screen-lg">
        <Header />
        <p className="text-xl">Seems you don not have MetaMask installed. Please, install and reload the page.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-6 font-mono max-w-screen-lg">
      <Header onWalletConnect={onWalletConnect}>
        <Status text="Application status" mark={appStatus} />
        { wallet && <p className="mt-3 text-sm">Wallet connected: {wallet}</p> }
      </Header>
      <Keystore />
      <KeystoreDetails />
    </main>
  );
}
