"use client";
import { Header } from "@/app/components/Header";
import { Keystore } from "@/app/components/Keystore";
import { KeystoreDetails } from "@/app/components/KeystoreDetails";
import { useWallet } from "@/hooks";

export default function KeystorePage() {
    const { onWalletConnect } = useWallet();
  return (
    <main className="flex min-h-screen flex-col p-24 font-mono max-w-screen-lg m-auto">
      <Header onWalletConnect={onWalletConnect} />
      <Keystore />
      <KeystoreDetails />
    </main>
  );
}
