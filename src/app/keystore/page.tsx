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
  return (
    <main className="flex min-h-screen flex-col p-24 font-mono max-w-screen-lg m-auto">
      <Header onWalletConnect={onWalletConnect}>
        <Status text="Application status" mark={appStatus} />
        {wallet && <p className="mt-3 text-sm">Wallet connected: {wallet}</p> }
      </Header>
      <Keystore />
      <KeystoreDetails />
    </main>
  );
}
