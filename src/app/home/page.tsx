"use client";
import { Header } from "@/app/components/Header";
import { Waku } from "@/app/components/Waku";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-24 font-mono max-w-screen-lg">
      <Header />
      <Waku />
    </main>
  );
}
