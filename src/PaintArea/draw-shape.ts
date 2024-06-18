import { IoSquare } from "solid-icons/io";
import {
	TbBucket,
	TbCircleFilled,
	TbSlash,
	TbSquare,
	TbWriting,
} from "solid-icons/tb";
import { DrawShape } from "../paint";
import { Component } from "solid-js";

export const DRAW_SHAPE_ICON: { [key in DrawShape]: Component<any> } = {
	free: TbWriting,
	rect: TbSquare,
	fillRect: IoSquare,
	//ellipse: TbCircle,
	fillEllipse: TbCircleFilled,
	line: TbSlash,
	fill: TbBucket,
};
