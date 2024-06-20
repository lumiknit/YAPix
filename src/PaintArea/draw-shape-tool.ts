import { IoSquare } from "solid-icons/io";
import {
	TbArrowsMove,
	TbBrush,
	TbBucket,
	TbCircleFilled,
	TbColorPicker,
	TbDeselect,
	TbEraser,
	TbSelectAll,
	TbSlash,
	TbSquare,
	TbTextSize,
	TbWriting,
	TbZoomPan,
} from "solid-icons/tb";
import { DrawShape, ToolType } from "../paint";
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

export const TOOL_ICON: { [key in ToolType]: Component<any> } = {
	brush: TbBrush,
	eraser: TbEraser,
	spoid: TbColorPicker,
	move: TbArrowsMove,
	zoom: TbZoomPan,
	select: TbSelectAll,
	deselect: TbDeselect,
	text: TbTextSize,
};
