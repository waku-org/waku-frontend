import { Block, BlockTypes } from "@/components/Block";
import { Title } from "@/components/Title";
import { Status } from "@/components/Status";
import { useStore, useWallet } from "@/hooks";
import { Button } from "@/components/Button";

export const Header: React.FunctionComponent<{}> = () => {
  const { appStatus, wallet } = useStore();
  const { onWalletConnect } = useWallet();

  return (
    <>
      <Block className="mb-5" type={BlockTypes.FlexHorizontal}>
        <Title>Waku RLN</Title>
        <Button onClick={onWalletConnect}>
          Connect Wallet
        </Button>
      </Block>
      <Status text="Application status" mark={appStatus} />
      {wallet && <p className="mt-3 text-sm">Wallet connected: {wallet}</p> }
    </>
  );
};
