import { Dynamic } from "solid-js/web";
import { PAGES, RouterState } from "./state";

type Props = {
	z: RouterState;
};

const TopRouter = (props: Props) => {
	return <Dynamic component={PAGES[props.z.current()]} />;
};

export default TopRouter;
