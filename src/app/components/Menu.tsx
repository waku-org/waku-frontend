import Link from "next/link";
import { Block } from "@/components/Block";

export const Menu: React.FunctionComponent<{}> = () => {
  return (
    <Block className="m-5 flex text-lg">
        <p className="mr-5">{">"}</p>
        <p className="mr-5"><Link href="/">Chat</Link></p>
        <p><Link href="/keystore">Keystore</Link></p>
    </Block>
  );
};
