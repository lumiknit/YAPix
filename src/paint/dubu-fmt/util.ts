import { CanvasCtx2D, ctxFromPNGBase64, emptyCanvasContext } from "@/common";
import { DubuFmt } from ".";

export const previewDubuFmt = async (z: DubuFmt): Promise<CanvasCtx2D> => {
	const ctx = emptyCanvasContext(z.size.width, z.size.height);

	for (const l of z.layers) {
		if (!l.visible) continue;
		const layerCtx = await ctxFromPNGBase64(l.data);
		ctx.globalAlpha = l.opacity;
		ctx.globalCompositeOperation = "source-over";
		ctx.drawImage(layerCtx.canvas, l.off.x, l.off.y);
	}

	return ctx;
};
