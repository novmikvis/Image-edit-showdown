# Fibo 2 vs Klein 9b vs Qwen 2.1: plain and enhanced prompts

A set of experiments to see how three fast image models handle the same requests, with and without prompt enhancement.

<p align="left">
<a href="https://novmikvis.github.io/Image-edit-showdown/">
  <img src="https://github.com/user-attachments/assets/de5ef820-5c5a-4097-9c1e-4fbb14bc54a4" width="1000" alt="Fibo 2, Klein 9b and Qwen 2.1 image comparison viewer">
</a>
</p>

#### **[Open the viewer →](https://novmikvis.github.io/Image-edit-showdown/)**

I ran 16 image-editing cases and 16 text-to-image prompts through all three models, using a plain and an enhanced prompt for each. 

Seed is the same `424242`  at roughly 1 megapixel and CFG 1. Fibo 2 turbo edit and Klein 9b use 4 steps; Qwen 2.1 turbo uses 8. All three use INT8 convrot weights; Klein is the distilled version. Exact dimensions and run settings are listed in the viewer below the image

Plain prompts used as is. For the enhanced versions, Luna 6 with xhigh expands each into the model's format:

* Fibo 2 uses [VGL JSON](https://github.com/Bria-AI/vgl/tree/dev/src/bria_vgl/dialects/thales).
* Klein 9b uses [FLUX2 JSON](https://docs.bfl.ml/guides/usecases_t2i_json_prompting).
* Qwen 2.1 uses prose, with separate enhancers for [editing](https://pastebin.com/vvnnAtiX) and [text to image](https://pastebin.com/J9ruPcts).

The editing cases cover small targeted changes, relighting, style preservation, meme identity swaps and difficult geometry. 
The text-to-image prompts test counts, spatial relationships, small text, multilingual signs, branding, crowds, reflections and comic panels. Both the original request and the executed prompt are available for every result.

## How to use the viewer

* Pick a scene from the right sidebar on desktop or the top picker on mobile. Use the model buttons to choose a plain or enhanced result.
* On desktop, scroll to zoom and drag to pan. The crop stays in place when switching variants, so you can compare the same detail. Use **Tools → Fit** to reset.
* Keys: `↑` `↓` switch scenes; `←` `→` switch images. Hold `Space` to show the original in editing, or swap plain and enhanced for the same model in T2I.
* On mobile, pinch to zoom. Hold the image or the comparison button to compare; release to return.
* **Full details** opens the prompts, settings, source links and workflow download below the image.

## Reproducibility

**Download original workflow**  us under each result. Drag into comfy and load images to get same results _(hopefully)_

## Sources and caveats

Editing cases come from [GenAI Showdown](https://genai-showdown.specr.net/image-editing) and [OpenRouter's meme benchmark](https://openrouter.ai/benchmarks/media/memes/math-lady). Each case links to its source page in the viewer.

Fibo turbo edit is meant for editing. Its developers recommend [Fibo 2.0 Dev](https://huggingface.co/briaai/Fibo-2.0-dev) for text to image, so treat its T2I results with that limitation in mind.

This is an opinionated study with one seed and a small set of cases, not an overall model ranking. Reference-image preprocessing differs between models, and visible failures are kept in the panel.
