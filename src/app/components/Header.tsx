import { Block, BlockTypes } from "@/components/Block";
import { Title } from "@/components/Title";
import { Button } from "@/components/Button";

type HeaderProps = {
  children?: React.ReactNode;
  onWalletConnect?: () => void;
}

export const Header: React.FunctionComponent<HeaderProps> = (props) => {
  return (
    <>
      <Block className="mb-5" type={BlockTypes.FlexHorizontal}>
        <Title>Waku</Title>
        {props.onWalletConnect && (
          <Button onClick={props.onWalletConnect}>
            Connect Wallet
          </Button>
        )}
      </Block>
      {props.children}
    </>
  );
};
