/** Static image, video and audio catalog preserving provider identifiers. */
import type { Model } from "./model-types.ts";

// Preserve the existing image, video and audio catalogue order and provider IDs.
// @spec FR-001: Keep registration within convention file limits — .specs/features/009-decision-models/spec.md#fr-001
/** Static image, video and audio catalog in stable display order. */
export const GENERATION_MODELS: ReadonlyArray<Model> = [
	// --- Poyo image models ---
	{
		id: "google/gemini-3.1-flash-image",
		type: "image",
		providers: {
			poyo: "nano-banana-2-new",
		},
	},
	{
		id: "google/gemini-3.1-flash-image-edit",
		type: "image",
		providers: {
			poyo: "nano-banana-2-new-edit",
		},
	},
	{
		id: "google/nano-banana-2",
		type: "image",
		providers: {
			poyo: "nano-banana-2",
		},
	},
	{
		id: "google/nano-banana-2-edit",
		type: "image",
		providers: {
			poyo: "nano-banana-2-edit",
		},
	},
	{
		id: "google/nano-banana",
		type: "image",
		providers: {
			poyo: "nano-banana",
		},
	},
	{
		id: "google/nano-banana-edit",
		type: "image",
		providers: {
			poyo: "nano-banana-edit",
		},
	},
	{
		id: "bytedance/seedream-5.0-lite",
		type: "image",
		providers: {
			poyo: "seedream-5.0-lite",
		},
	},
	{
		id: "bytedance/seedream-5.0-lite-edit",
		type: "image",
		providers: {
			poyo: "seedream-5.0-lite-edit",
		},
	},
	{
		id: "bytedance/seedream-4.5",
		type: "image",
		providers: {
			poyo: "seedream-4.5",
		},
	},
	{
		id: "bytedance/seedream-4.5-edit",
		type: "image",
		providers: {
			poyo: "seedream-4.5-edit",
		},
	},
	{
		id: "openai/gpt-5.4-image-2",
		type: "image",
		providers: {
			poyo: "gpt-5.4-image-2",
		},
	},
	{
		id: "openai/gpt-5.4-image-2-edit",
		type: "image",
		providers: {
			poyo: "gpt-5.4-image-2-edit",
		},
	},
	{
		id: "openai/gpt-image-1.5",
		type: "image",
		providers: {
			poyo: "gpt-image-1.5",
		},
	},
	{
		id: "openai/gpt-image-1.5-edit",
		type: "image",
		providers: {
			poyo: "gpt-image-1.5-edit",
		},
	},
	{
		id: "openai/gpt-4o-image",
		type: "image",
		providers: {
			poyo: "gpt-4o-image",
		},
	},
	{
		id: "openai/gpt-4o-image-edit",
		type: "image",
		providers: {
			poyo: "gpt-4o-image-edit",
		},
	},
	{
		id: "openai/z-image",
		type: "image",
		providers: {
			poyo: "z-image",
		},
	},
	{
		id: "bfl/flux-2-pro",
		type: "image",
		providers: {
			poyo: "flux-2-pro",
		},
	},
	{
		id: "bfl/flux-2-pro-edit",
		type: "image",
		providers: {
			poyo: "flux-2-pro-edit",
		},
	},
	{
		id: "bfl/flux-2-flex",
		type: "image",
		providers: {
			poyo: "flux-2-flex",
		},
	},
	{
		id: "bfl/flux-2-flex-edit",
		type: "image",
		providers: {
			poyo: "flux-2-flex-edit",
		},
	},
	{
		id: "xai/grok-imagine",
		type: "image",
		providers: {
			poyo: "grok-imagine-image",
		},
	},

	// --- Poyo video models ---
	{
		id: "openai/sora-2-official",
		type: "video",
		providers: {
			poyo: "sora-2-official",
		},
	},
	{
		id: "openai/sora-2",
		type: "video",
		providers: {
			poyo: "sora-2",
		},
	},
	{
		id: "openai/sora-2-pro",
		type: "video",
		providers: {
			poyo: "sora-2-pro",
		},
	},
	{
		id: "openai/sora-2-stable",
		type: "video",
		providers: {
			poyo: "sora-2-stable",
		},
	},
	{
		id: "kuaishou/kling-3.0-pro",
		type: "video",
		providers: {
			poyo: "kling-3.0/pro",
		},
	},
	{
		id: "kuaishou/kling-3.0-standard",
		type: "video",
		providers: {
			poyo: "kling-3.0/standard",
		},
	},
	{
		id: "kuaishou/kling-3.0-motion-control",
		type: "video",
		providers: {
			poyo: "kling-3.0-motion-control",
		},
	},
	{
		id: "kuaishou/kling-2.6",
		type: "video",
		providers: {
			poyo: "kling-2-6",
		},
	},
	{
		id: "kuaishou/kling-2.6-motion-control",
		type: "video",
		providers: {
			poyo: "kling-2-6-motion-control",
		},
	},
	{
		id: "kuaishou/kling-2.5-turbo-pro",
		type: "video",
		providers: {
			poyo: "kling-2-5-turbo-pro",
		},
	},
	{
		id: "kuaishou/kling-2.1-standard",
		type: "video",
		providers: {
			poyo: "kling-2-1/standard",
		},
	},
	{
		id: "kuaishou/kling-2.1-pro",
		type: "video",
		providers: {
			poyo: "kling-2-1/pro",
		},
	},
	{
		id: "minimax/hailuo-2.3",
		type: "video",
		providers: {
			poyo: "hailuo-2-3",
		},
	},
	{
		id: "minimax/hailuo-02",
		type: "video",
		providers: {
			poyo: "hailuo-02",
		},
	},
	{
		id: "minimax/hailuo-02-pro",
		type: "video",
		providers: {
			poyo: "hailuo-02-pro",
		},
	},
	{
		id: "alibaba/wan-2.2-text-to-video-fast",
		type: "video",
		providers: {
			poyo: "wan2.2-text-to-video-fast",
		},
	},
	{
		id: "alibaba/wan-2.2-image-to-video-fast",
		type: "video",
		providers: {
			poyo: "wan2.2-image-to-video-fast",
		},
	},
	{
		id: "alibaba/wan-2.5-text-to-video",
		type: "video",
		providers: {
			poyo: "wan2.5-text-to-video",
		},
	},
	{
		id: "alibaba/wan-2.5-image-to-video",
		type: "video",
		providers: {
			poyo: "wan2.5-image-to-video",
		},
	},
	{
		id: "alibaba/wan-2.6-text-to-video",
		type: "video",
		providers: {
			poyo: "wan2.6-text-to-video",
		},
	},
	{
		id: "alibaba/wan-2.6-image-to-video",
		type: "video",
		providers: {
			poyo: "wan2.6-image-to-video",
		},
	},
	{
		id: "alibaba/wan-2.6-video-to-video",
		type: "video",
		providers: {
			poyo: "wan2.6-video-to-video",
		},
	},
	{
		id: "alibaba/wan-animate-move",
		type: "video",
		providers: {
			poyo: "wan-animate-move",
		},
	},
	{
		id: "alibaba/wan-animate-replace",
		type: "video",
		providers: {
			poyo: "wan-animate-replace",
		},
	},
	{
		id: "bytedance/seedance-1.0-pro",
		type: "video",
		providers: {
			poyo: "seedance-1-0-pro",
		},
	},
	{
		id: "bytedance/seedance-1.5-pro",
		type: "video",
		providers: {
			poyo: "seedance-1.5-pro",
		},
	},
	{
		id: "runway/gen-4.5",
		type: "video",
		providers: {
			poyo: "runway-gen-4-5",
		},
	},
	{
		id: "google/veo-3.1-fast",
		type: "video",
		providers: {
			poyo: "veo3.1-fast",
		},
	},
	{
		id: "google/veo-3.1-quality",
		type: "video",
		providers: {
			poyo: "veo3.1-quality",
		},
	},
	{
		id: "xai/grok-imagine-video",
		type: "video",
		providers: {
			poyo: "grok-imagine",
		},
	},

	// --- Soniox ---
	{
		id: "soniox/soniox",
		type: "audio",
		providers: {
			poyo: "soniox",
		},
	},
];
