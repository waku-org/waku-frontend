import React from "react";
import { useStore } from "./useStore";
import { useRLN } from "./useRLN";
import { SEPOLIA_CONTRACT } from "@waku/rln";
import { StatusEventPayload } from "@/services/rln";
import { SIGNATURE_MESSAGE } from "@/constants";

type UseKeystoreResult = {
  onReadCredentials: (hash: string, password: string) => void;
  onRegisterCredentials: (password: string) => void;
};

export const useKeystore = (): UseKeystoreResult => {
  const { rln } = useRLN();
  const {
    setActiveCredential,
    setActiveMembershipID,
    setAppStatus,
    setCredentials,
  } = useStore();

  const generateCredentials = async () => {
    if (!rln?.ethProvider) {
      console.log("Cannot generate credentials, no provider found.");
      return;
    }

    const signer = rln?.ethProvider.getSigner();
    const signature = await signer.signMessage(
      `${SIGNATURE_MESSAGE}. Nonce: ${randomNumber()}`
    );
    const credentials = await rln.rlnInstance?.generateSeededIdentityCredential(
      signature
    );
    return credentials;
  };

  const onRegisterCredentials = React.useCallback(
    async (password: string) => {
      if (!rln?.rlnContract || !password) {
        console.log(`Not registering - missing dependencies: contract-${!!rln?.rlnContract}, password-${!!password}`);
        return;
      }

      try {
        const credentials = await generateCredentials();

        if (!credentials) {
          console.log("No credentials registered.");
          return;
        }

        setAppStatus(StatusEventPayload.CREDENTIALS_REGISTERING);
        const membershipInfo = await rln.rlnContract.registerWithKey(
          credentials
        );
        const membershipID = membershipInfo!.index.toNumber();
        const keystoreHash = await rln.keystore.addCredential(
          {
            membership: {
              treeIndex: membershipID,
              chainId: SEPOLIA_CONTRACT.chainId,
              address: SEPOLIA_CONTRACT.address,
            },
            identity: credentials,
          },
          password
        );

        setActiveCredential(keystoreHash);
        setCredentials(credentials);
        setActiveMembershipID(membershipID);
        rln.saveKeystore();
        setAppStatus(StatusEventPayload.CREDENTIALS_REGISTERED);
      } catch (error) {
        setAppStatus(StatusEventPayload.CREDENTIALS_FAILURE);
        console.error("Failed to register to RLN Contract: ", error);
        return;
      }
    },
    [rln, setActiveCredential, setActiveMembershipID, setAppStatus]
  );

  const onReadCredentials = React.useCallback(
    async (hash: string, password: string) => {
      if (!rln || !hash || !password) {
        return;
      }

      try {
        const record = await rln.keystore.readCredential(hash, password);
        if (record) {
          setCredentials(record.identity);
          setActiveCredential(hash);
          setActiveMembershipID(record.membership.treeIndex);
        }
      } catch (error) {
        console.error("Failed to read credentials from Keystore.");
        return;
      }
    },
    [rln, setActiveCredential, setActiveMembershipID, setCredentials]
  );

  return {
    onRegisterCredentials,
    onReadCredentials,
  };
};

function randomNumber(): number {
  return Math.ceil(Math.random() * 1000);
}
