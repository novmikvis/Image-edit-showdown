# Opinionated image studies

An image-first comparison of Fibo 2 edit turbo, Klein 9b and Qwen 2.1 turbo.

- Editing: 16 scenes, 96 outputs, 16 template images and two identity references. Sections: General edits, Meme swap and Model breakers.
- Text to image: 16 scenes and 96 outputs.
- Plain and enhanced prompts; seed 424242, CFG 1. Fibo 2 and Klein 9b use four steps; Qwen 2.1 uses eight.
- Enhancements use Luna 6 with xhigh reasoning.

Open `docs/index.html` for editing or `docs/t2i/index.html` for generation. The site is static, uses relative URLs, and makes no runtime API calls.

## Controls

Up/down changes scenes; left/right changes images. Hold Space or the hold button to reveal the original in Edit or swap plain/enhanced for the same model in T2I.

On desktop, scroll over the image to zoom at the pointer; drag to pan. Zoom and pan remain fixed when switching variants. Double-click or use Fit to reset. Mobile uses native browser pinch zoom. Full details opens the generation context and prompts below the image. The desktop sidebar lists samples with thumbnails and test purposes. On mobile, the top picker chooses a scene, the bottom left/right arrows cycle model/prompt variants, and the image up/down arrows change scenes. The hold button sits with the bottom controls. Holding the image also compares; movement or a second touch cancels comparison so native gestures can take over.

## Workflows and images

Download original workflow provides the executed ComfyUI graph in API JSON format, importable into ComfyUI. Model and custom-node dependencies must be installed. Editing workflows also require their source input images; meme swaps use a template plus one or two identity references. Node identifiers and output prefixes are normalized for distribution.

JPEG XL images retain their saved dimensions and embed prompts and generation settings in XMP metadata.

Qwen edit enhancements use the [edit enhancer](https://pastebin.com/vvnnAtiX). Qwen T2I enhancements use the [image-description enhancer](https://pastebin.com/J9ruPcts).

## GitHub Pages

Deploy the repository branch's `/docs` folder, or select GitHub Actions and run the included deployment workflow manually. This package is prepared locally; it has not been published.

The editing cases come from [GenAI Showdown](https://genai-showdown.specr.net/image-editing) and [OpenRouter’s meme benchmark](https://openrouter.ai/benchmarks/media/memes/math-lady). Individual source links are included in the page. Attribution does not change ownership or licensing. This small study does not establish an overall model ranking.
