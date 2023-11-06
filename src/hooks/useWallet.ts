import React from "react";
import { useStore } from "./useStore";
import { isEthereumEvenEmitterValid } from "@/utils/ethereum";
import { useRLN } from "./useRLN";
import { SIGNATURE_MESSAGE } from "@/constants";

type UseWalletResult = {
  onWalletConnect: () => void;
  onGenerateCredentials: () => void;
};

export const useWallet = (): UseWalletResult => {
  const { rln } = useRLN();
  const { setEthAccount, setChainID, setCredentials } = useStore();

  React.useEffect(() => {
    const ethereum = window.ethereum;
    if (!isEthereumEvenEmitterValid(ethereum)) {
      console.log("Cannot subscribe to ethereum events.");
      return;
    }

    const onAccountsChanged = (accounts: string[]) => {
      setEthAccount(accounts[0] || "");
    };
    ethereum.on("accountsChanged", onAccountsChanged);

    const onChainChanged = (chainID: string) => {
      const ID = parseInt(chainID, 16);
      setChainID(ID);
    };
    ethereum.on("chainChanged", onChainChanged);

    return () => {
      ethereum.removeListener("chainChanged", onChainChanged);
      ethereum.removeListener("accountsChanged", onAccountsChanged);
    };
  }, [setEthAccount, setChainID]);

  const onWalletConnect = async () => {
    const ethereum = window.ethereum;
    
    if (!ethereum) {
      console.log("No ethereum instance found.");
      return;
    }

    if (!rln?.rlnInstance) {
      console.log("RLN instance is not initialized.");
      return;
    }
    
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await rln.initRLNContract(rln.rlnInstance);
    } catch(error) {
      console.error("Failed to conenct to wallet.");
    }
  };

  const onGenerateCredentials = React.useCallback(async () => {
    if (!rln?.ethProvider) {
      console.log("Cannot generate credentials, no provider found.");
      return;
    }

    const signer = rln.ethProvider.getSigner();
    const signature = await signer.signMessage(
      `${SIGNATURE_MESSAGE}. Nonce: ${randomNumber()}`
    );
    const credentials = await rln.rlnInstance?.generateSeededIdentityCredential(
      signature
    );
    setCredentials(credentials);
  }, [rln, setCredentials]);

  return {
    onWalletConnect,
    onGenerateCredentials,
  };
};

function randomNumber(): number {
  return Math.ceil(Math.random() * 1000);
}
