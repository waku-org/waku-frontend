import { Block, BlockTypes } from "@/components/Block";
import { Title } from "@/components/Title";
import { Status } from "@/components/Status";
import { useStore } from "@/hooks";
import { Button } from "@/components/Button";

type HeaderProps = {
  onWalletConnect?: () => void;
}

export const Header: React.FunctionComponent<HeaderProps> = (props) => {
  const { appStatus, wallet } = useStore();

  return (
    <>
      <Block className="mb-5" type={BlockTypes.FlexHorizontal}>
        <Title>Waku RLN</Title>
        {props.onWalletConnect && (
          <Button onClick={props.onWalletConnect}>
            Connect Wallet
          </Button>
        )}
      </Block>
      <Status text="Application status" mark={appStatus} />
      {wallet && <p className="mt-3 text-sm">Wallet connected: {wallet}</p> }
    </>
  );
};
