import { Block, BlockTypes } from "@/components/Block";
import { Title } from "@/components/Title";
import { useStore } from "@/hooks";

export const Header: React.FunctionComponent<{}> = () => {
  return (
    <>
      <Block className="mb-5" type={BlockTypes.FlexHorizontal}>
        <Title>Waku RLN</Title>
      </Block>
    </>
  );
};
