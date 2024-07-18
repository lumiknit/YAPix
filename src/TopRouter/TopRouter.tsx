import { Dynamic } from "solid-js/web";
import { PAGES, PageType, RouterState } from "./state";

type Props = {
	z: RouterState;
};

const TopRouter = (props: Props) => {
	return (
		<Dynamic
			component={PAGES[props.z.current()]}
			changePage={(p: PageType) => {
				props.z.setCurrent(p);
			}}
		/>
	);
};

export default TopRouter;
