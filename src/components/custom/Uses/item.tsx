import { Link } from "@/i18n/routing";
import type { Item } from "@/lib/types";
import { twc } from "react-twc";

const Col = twc.div`flex flex-col items-start gap-2`;
const Cell = twc.div`flex items-center gap-2`;

const Item: React.FC<Item> = ({ Icon, title, description }) => (
  <Col>
    <Cell>
      <Icon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
      <Link href="/" className="text-lg font-semibold hover:underline">
        {title}
      </Link>
    </Cell>
    <p className="text-gray-500 dark:text-gray-400">{description}</p>
  </Col>
);

export default Item;
