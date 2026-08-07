# PHX — AI Video Prompt Pack
**For Veo 3 via Google Labs / Flow (or Gemini).** Copy each prompt verbatim. Each one names the file it becomes and the slot it fills on the landing page.

---

## Before you start — three rules that decide whether this looks good

**1. Everything is a background plate, not a scene.** Text sits on top of every one of these. So: dark, low-contrast, slow, and nothing important in the middle third. If a clip has a subject you'd want to look at, it's wrong for this page.

**2. Match the palette exactly.** Every prompt below carries the same colour instruction. Don't paraphrase it — colour drift between plates is the single fastest way to make a page look assembled instead of designed. The palette is: near-black `#07070F`, ember orange `#F97316`, gold `#FBA51F`. Nothing cyan, nothing magenta, nothing teal.

**3. Veo 3 generates audio you don't want.** Every plate on this page is muted and looping. Strip audio in the ffmpeg step (`-an`) — don't rely on the `muted` attribute alone, since it wastes bandwidth.

**4. Generate everything at 16:9 — then crop.** Veo 3.1 supports 16:9, 9:16, 1:1 and 4:3 natively. It does **not** offer 21:9. So every wide plate below is generated at 16:9 and cropped to a 21:9 band in ffmpeg. The prompts are already written for this: nothing important sits near the top or bottom edge, so the crop takes nothing away.

**Generation settings for all clips:** 16:9 (unless noted) · 1080p or higher · 24fps · max 8s per generation · no audio needed.

*Model note: Veo 3.1 is current in Flow (3.1 Lite since March 2026). 8s is the hard per-generation cap — use Scene Extension if you ever want longer, though nothing on this page needs it.*

---

## V1 — `city-drift.mp4`
**Slot A**, inside "How it works." The establishing shot: this is Phoenix, at night, and it's ours.
**Generate:** 16:9, 8s → **crop to 21:9** · seamless loop

> Aerial drone shot drifting slowly forward and very slightly downward over a vast desert city grid at night, seen from roughly 1,500 feet. Perfectly rectilinear street grid stretching to a flat horizon, characteristic of Phoenix, Arizona. Streets are picked out in warm amber sodium-vapour streetlights; the blocks between them are almost entirely dark. Faint heat shimmer distorts the far distance. A low mountain silhouette sits on the horizon line, backlit by the last deep-orange band of dusk. Extremely slow, steady, cinematic camera movement — no rotation, no acceleration, no cuts. Shallow atmospheric haze. Colour palette strictly near-black #07070F, ember orange #F97316, and gold #FBA51F — no blue, no cyan, no green, no white light sources. Shot on anamorphic lenses, 24fps, subtle film grain, deep shadows, high dynamic range with crushed blacks. Nothing in the centre of frame; visual interest at the edges only.

**Negative prompt:** `text, logos, signage, lens flares, people, cars with white headlights, blue or cyan light, daytime, sun, clouds, fast motion, camera shake, zoom, cuts, watermarks`

---

## V2 — `stage-embers.mp4`
**Slot B**, under the artist roster. This one connects visually to the WebGL phoenix — it should look like the same embers.
**Generate:** 16:9, 6s → **crop to 21:9** · seamless loop

> Extreme close-up of glowing orange embers and fine sparks rising slowly through pitch darkness, like the air above a dying fire. Hundreds of small out-of-focus points of light drifting upward at varying speeds, some tumbling, some fading out mid-rise. Very shallow depth of field — most embers are soft bokeh circles, only a few in sharp focus. The background is pure black with no visible source, no fire, no logs, no smoke plume. Motion is gentle and continuous, never chaotic. Colour palette strictly near-black #07070F, ember orange #F97316, and gold #FBA51F, with the hottest sparks reaching pale gold-white at their cores only. Macro lens, 24fps, natural ember flicker, high dynamic range, deep crushed blacks. Locked-off camera — no movement at all.

**Negative prompt:** `fire, flames, campfire, logs, smoke, fireworks, text, people, blue flame, white background, camera movement, fast motion, watermarks`

---

## V3 — `sunset-wipe.mp4`
An optional transition plate — a wipe between the narrative and the content sections, or between page sections. Use sparingly; one is plenty.
**Generate:** 16:9, 4s → **crop to 21:9** · does NOT need to loop (plays once on scroll trigger)

> Extreme wide shot of a Sonoran desert horizon at the exact moment the sun drops below the ridgeline. A single intense band of ember-orange light burns along the horizon, and a soft anamorphic flare stretches horizontally across the frame, sweeping slowly from left to right before the entire frame falls to near-black. Saguaro cactus silhouettes in the far foreground, rendered as pure black shapes with no interior detail. No visible sun disc. Slow, continuous, dreamlike motion. Colour palette strictly near-black #07070F, ember orange #F97316, and gold #FBA51F. Anamorphic lens, 24fps, heavy atmospheric haze, cinematic grade, crushed blacks. Ends fully black.

**Negative prompt:** `sun disc, bright sky, blue sky, clouds, people, buildings, text, daytime, purple, pink, magenta, watermarks`

---

## V4 — `street-neon.mp4`
Optional, for when PHX Eats / Drops / Cuts go live. Hold this one until you actually have those verticals.
**Generate:** 16:9, 6s → **crop to 21:9** · seamless loop

> Slow lateral tracking shot along a dark city street at night after rain, camera moving right to left at walking pace. Wet asphalt reflects warm amber and orange neon signage as soft vertical smears of light. Signs are out of focus and illegible — pure shape and colour, no readable words. No people, no moving cars. Deep shadow occupies most of the frame. Colour palette strictly near-black #07070F, ember orange #F97316, and gold #FBA51F — no blue, cyan, purple, or green neon of any kind. Shot on a 35mm anamorphic lens at f/1.8, very shallow depth of field, 24fps, filmic grain, crushed blacks, high contrast.

**Negative prompt:** `readable text, brand names, logos, people, faces, cars, blue neon, cyan, purple, pink, daylight, camera shake, watermarks`

---

## V5 — `phoenix-ignite.mp4`
The reduced-motion and no-WebGL fallback, and a great Instagram/story asset. This is the one clip where the subject IS the point.
**Generate:** **9:16 and 1:1** (both native — this is the one clip that is NOT landscape), 5s · loop optional

> A geometric, faceted, origami-style phoenix with outstretched wings materialises out of darkness, formed entirely from thousands of individual glowing embers that fly inward from off-screen and lock into place. The bird is built from sharp angular triangular facets — low-poly, not organic or feathered — with a gradient running from deep ember orange at the wingtips to bright gold at the body. Once assembled it holds still and pulses gently, embers drifting off the edges. Pure black background, no environment, no ground. Centred, symmetrical composition. Colour palette strictly near-black #07070F, ember orange #F97316, and gold #FBA51F. Locked-off camera, 24fps, high dynamic range, deep crushed blacks, subtle bloom on the hottest embers.

**Negative prompt:** `realistic bird, feathers, eagle, photorealistic, fire, flames, text, background scenery, ground, sky, camera movement, blue, purple, watermarks`

**Tip:** attach `assets/phoenix-mark.png` as a reference image if the tool supports it — it'll hold the exact silhouette much better than the description alone.

---

## Aspect ratio at a glance

| Clip | Generate at | Ends up as | Why |
|---|---|---|---|
| V1 city-drift | 16:9 | 21:9 band | Sits in a fixed 21:9 slot in the page |
| V2 stage-embers | 16:9 | 21:9 band | Same |
| V3 sunset-wipe | 16:9 | 21:9 band | Same |
| V4 street-neon | 16:9 | 21:9 band | Same |
| **V5 phoenix-ignite** | **9:16 + 1:1** | full-bleed / square | The only full-screen one — it's the no-WebGL fallback and your Instagram asset |

**Why landscape is still right for mobile.** The four wide plates aren't full-screen backgrounds — they sit in a fixed 21:9 band inside the page (`.vslot`, with `object-fit:cover`). On a 390px phone that band is simply narrower, not taller. Generating those vertically would mean cropping away ~70% of the frame to fit the band, which throws out most of what you paid to generate.

V5 is the exception precisely because it *is* full-bleed: it replaces the whole WebGL scene when someone has reduced-motion on or no WebGL. That one needs 9:16 for phones and 1:1 for social.

### Cropping 16:9 → 21:9

```bash
# centre-crop, keeping full width
ffmpeg -i raw.mp4 -vf "crop=iw:iw*9/21" -an cropped.mp4

# if the interesting part sits low in frame (V1 city grid, V3 horizon),
# bias the crop downward instead of centring it:
ffmpeg -i raw.mp4 -vf "crop=iw:iw*9/21:0:ih*0.34" -an cropped.mp4
```

Check the biased version against the centred one for V1 and V3 — the horizon line usually reads better slightly below centre.

---

## Making them loop (the part everyone skips)

Veo won't hand you a seamless loop. Two options:

**Option A — mirror loop (fastest, works for V1, V2, V4).** Play forward then backward. Invisible on slow drifting footage.

```bash
ffmpeg -i raw.mp4 -filter_complex "[0]reverse[r];[0][r]concat=n=2:v=1:a=0" -an loop.mp4
```

**Option B — crossfade the tail into the head (better for V2 embers).** Overlap the last 1s onto the first 1s.

```bash
ffmpeg -i raw.mp4 -filter_complex \
  "[0]split[a][b];[a]trim=0:5,setpts=PTS-STARTPTS[main];\
   [b]trim=5:6,setpts=PTS-STARTPTS,format=yuva420p,fade=out:st=0:d=1:alpha=1[tail];\
   [main][tail]overlay" -an looped.mp4
```

## Compressing for the web

Every plate must land **under 2MB**. Uncompressed Veo output will be 20MB+ and will wreck the mobile experience you asked me to protect.

```bash
# H.264 — universal fallback
ffmpeg -i looped.mp4 -an -vf "scale=1600:-2" -c:v libx264 -crf 30 \
  -preset slow -profile:v high -pix_fmt yuv420p -movflags +faststart city-drift.mp4

# WebM/VP9 — ~35% smaller, serve first
ffmpeg -i looped.mp4 -an -vf "scale=1600:-2" -c:v libvpx-vp9 -crf 38 \
  -b:v 0 -row-mt 1 city-drift.webm

# Poster frame (shown before the video loads, and on save-data connections)
ffmpeg -i looped.mp4 -vf "select=eq(n\,12)" -vframes 1 -q:v 3 city-drift.jpg
```

Then swap the placeholder in `index.html` for:

```html
<div class="vslot" data-slot="city-drift">
  <video poster="assets/video/city-drift.jpg" autoplay muted loop playsinline preload="none">
    <source src="assets/video/city-drift.webm" type="video/webm">
    <source src="assets/video/city-drift.mp4"  type="video/mp4">
  </video>
</div>
```

**One mobile rule:** don't autoplay video on phones. Add this so plates only run where they're free:

```js
const saveData = navigator.connection?.saveData;
const small = matchMedia('(max-width:820px)').matches;
if (saveData || small) document.querySelectorAll('.vslot video')
  .forEach(v => { v.removeAttribute('autoplay'); v.load(); });
```

The poster frame still shows, so the section never looks broken — it just doesn't cost anyone 6MB on cell data.

---

## Where each file goes

| File | Slot | Section | Loop | Budget |
|---|---|---|---|---|
| `city-drift.mp4/.webm` | A | How it works | yes | < 2MB |
| `stage-embers.mp4/.webm` | B | Artist roster | yes | < 1.5MB |
| `sunset-wipe.mp4` | transition | between narrative and content | no | < 1MB |
| `street-neon.mp4` | C (future) | Verticals — hold until Eats/Drops ship | yes | < 2MB |
| `phoenix-ignite.mp4` | fallback + social | reduced-motion, no-WebGL, Instagram | optional | < 1.5MB |

All of them go in `phx/assets/video/`.

---

## If you want to push further with Google Labs

Two things worth trying once the basics are in:

- **Flow's frame-to-frame control** — feed the last frame of V1 as the first frame of V3 and you get a genuinely continuous camera move across two sections instead of a cut. This is the single biggest "how did they do that" upgrade available to you.
- **Whisk / image-to-video** — generate a still first (much cheaper to iterate on), get the composition and palette exactly right, *then* animate the still you approved. Far fewer wasted generations than prompting video blind.

One caution: generate V1 and V2 first and put them on the page before making anything else. Two plates that match perfectly beat five that almost match — and you'll learn more from seeing one in place than from a folder of clips.
