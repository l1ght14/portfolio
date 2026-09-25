"""Bake the reference GIFs into ASCII frame data for the portfolio scene player.

One scene per GIF. Each frame becomes a cols*rows string over the luminance
ramp; background cells are keyed to ramp index 0 (space) so they render
transparent over the panel. Luminance is normalised once per scene (not per
frame) so playback does not flicker.

    python tools/bake_scenes.py          # rewrite site/assets/scenes.js
    DUMP=1 python tools/bake_scenes.py   # also print a frame per scene

GIFs are read from image/ next to the repository, not from the deployed
site, so drop new references there and add a row to SCENES.
"""
from PIL import Image, ImageSequence
import numpy as np, json, os, glob

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
# The reference GIFs are source material, not repo content. Look inside the
# repo first, then next to it, and allow an explicit override.
GIF_DIR = os.environ.get("SCENE_GIFS") or next(
    (p for p in (os.path.join(ROOT, "image"),
                 os.path.join(os.path.dirname(ROOT), "image"))
     if os.path.isdir(p)),
    os.path.join(ROOT, "image"))

RAMP = " .:-=+*#%@"          # must match ascii/scenes.js
CELL_RATIO = 0.52           # must match the renderer
COLS = 48
MAX_FRAMES = 14
BG_TOL = 12                 # per-channel tolerance for keying the background
GAMMA = 0.82
CONTRAST = 1.30
PAD = 0.04                  # crop padding, fraction of the crop size
MAX_COVER = 0.60            # only scenes denser than this get touched
TARGET_COVER = 0.45         # ...and are thinned down to this

SCENES = [
    ("coding",     "coding",      "gustavorezende-person-23598_512.gif"),
    ("matrix",     "deep work",   "mxj_files-matrix-25406_512.gif"),
    ("cleaning",   "tidying up",  "sadutta-sweep-6391_512.gif"),
    ("headbanging","headbanging", "u_mey4kjj5ww-angry-2498_512.gif"),
    ("tea",        "tea break",   "curiouskitty-hamster-27958_512.gif"),
]

# run-length alphabet: the digit/letter at index n means "repeat the next
# glyph n+1 times". Frames are mostly background, so this is a large win.
ALPHA = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/"


def rle(text):
    out, i = [], 0
    while i < len(text):
        j = i
        while j < len(text) and text[j] == text[i]:
            j += 1
        n = j - i
        while n > 0:
            take = min(n, len(ALPHA))
            out.append(ALPHA[take - 1])
            out.append(text[i])
            n -= take
        i = j
    return "".join(out)


def flatten(frame):
    """Composite an RGBA frame onto white so alpha does not read as black."""
    im = frame.convert("RGBA")
    bgim = Image.new("RGBA", im.size, (255, 255, 255, 255))
    return Image.alpha_composite(bgim, im).convert("RGB")


def load(path, count):
    im = Image.open(path)
    frames = [flatten(f) for f in ImageSequence.Iterator(im)]
    if len(frames) <= count:
        return frames
    idx = [round(i * (len(frames) - 1) / (count - 1)) for i in range(count)]
    return [frames[i] for i in idx]


def corner_bg(arr):
    """Modal colour of the frame border, as the background key."""
    h, w, _ = arr.shape
    edge = np.concatenate([
        arr[0, :, :].reshape(-1, 3), arr[h - 1, :, :].reshape(-1, 3),
        arr[:, 0, :].reshape(-1, 3), arr[:, w - 1, :].reshape(-1, 3)])
    q = (edge // 8).astype(np.int32)
    keys = q[:, 0] * 4096 + q[:, 1] * 64 + q[:, 2]
    vals, counts = np.unique(keys, return_counts=True)
    k = int(vals[int(np.argmax(counts))])
    return np.array([(k >> 12) & 63, (k >> 6) & 63, k & 63], dtype=np.int16) * 8


def content_bbox(arrays, bgs):
    """Union bbox of everything that differs from its frame background."""
    lo = [10 ** 9, 10 ** 9]
    hi = [-1, -1]
    for arr, bg in zip(arrays, bgs):
        diff = np.abs(arr.astype(np.int16) - bg.reshape(1, 1, 3)).max(axis=2)
        mask = diff > BG_TOL
        if not mask.any():
            continue
        ys, xs = np.where(mask)
        lo[0] = min(lo[0], int(xs.min())); lo[1] = min(lo[1], int(ys.min()))
        hi[0] = max(hi[0], int(xs.max())); hi[1] = max(hi[1], int(ys.max()))
    return lo, hi


def to_cells(arr, cols):
    """Box-average an image down to cols x rows cells."""
    h, w, _ = arr.shape
    rows = max(4, round(cols * (h / w) / CELL_RATIO))
    ys = (np.arange(rows + 1) * h / rows).astype(int)
    xs = (np.arange(cols + 1) * w / cols).astype(int)
    out = np.empty((rows, cols, 3), dtype=np.float32)
    for y in range(rows):
        for x in range(cols):
            cell = arr[ys[y]:ys[y + 1], xs[x]:xs[x + 1]]
            out[y, x] = cell.reshape(-1, 3).mean(axis=0) if cell.size else 0.0
    return out


def bake(path):
    frames = load(path, MAX_FRAMES)
    arrays = [np.asarray(f, dtype=np.uint8) for f in frames]
    bgs = [corner_bg(a) for a in arrays]
    (x0, y0), (x1, y1) = content_bbox(arrays, bgs)
    h, w = arrays[0].shape[:2]
    x0 = max(0, x0); y0 = max(0, y0); x1 = min(w - 1, x1); y1 = min(h - 1, y1)
    px = int((x1 - x0) * PAD); py = int((y1 - y0) * PAD)
    x0 = max(0, x0 - px); y0 = max(0, y0 - py)
    x1 = min(w - 1, x1 + px); y1 = min(h - 1, y1 + py)

    cells = [to_cells(a[y0:y1 + 1, x0:x1 + 1], COLS) for a in arrays]
    rows = cells[0].shape[0]

    # one normalisation for the whole scene, so frames do not flicker
    lum = np.stack([0.2126 * c[:, :, 0] + 0.7152 * c[:, :, 1] + 0.0722 * c[:, :, 2]
                    for c in cells])
    subject = []
    for c, bg in zip(cells, bgs):
        d = np.abs(c - bg.reshape(1, 1, 3)).max(axis=2)
        subject.append(d > BG_TOL)
    mask = np.stack(subject)
    vals = lum[mask]
    lo, hi = (float(vals.min()), float(vals.max())) if vals.size else (0.0, 255.0)
    if hi - lo < 24:
        lo, hi = 0.0, 255.0

    # Normalised tone for every subject cell, used to find the density floor.
    t_all = np.clip((lum - lo) / max(1.0, hi - lo), 0, 1) ** GAMMA
    t_all = np.clip((t_all - 0.5) * CONTRAST + 0.5, 0, 1)
    cover = float(mask.mean())
    floor = 0.0
    if cover > MAX_COVER:
        # Bisect the tone floor so the *rendered* density lands on target.
        # A plain quantile is wrong here: skewed tone histograms collapse
        # coverage far below target. Cells are thresholded, never rescaled,
        # so survivors keep their original tone and the subject still pops.
        want = TARGET_COVER * mask.sum()
        lo_f, hi_f = 0.0, 1.0
        for _ in range(24):
            mid = (lo_f + hi_f) / 2
            if (t_all[mask] >= mid).sum() > want:
                lo_f = mid
            else:
                hi_f = mid
        floor = (lo_f + hi_f) / 2

    out = []
    for t, m in zip(t_all, mask):
        idx = np.rint(t * (len(RAMP) - 1)).astype(int)
        idx[~m] = 0                       # background -> space
        if floor > 0:
            idx[t < floor] = 0             # density floor -> space
        out.append("".join(RAMP[i] for i in idx.ravel()))
    return rows, out, (x1 - x0 + 1, y1 - y0 + 1), cover, floor, "".join(ALPHA)


def main():
    scenes, report = [], []
    for sid, label, name in SCENES:
        path = os.path.join(GIF_DIR, name)
        if not os.path.exists(path):
            print("MISSING %s  (expected in %s)" % (name, GIF_DIR)); continue
        rows, frames, crop, cover, floor, alpha = bake(path)
        packed = [rle(f) for f in frames]
        raw = sum(len(f) for f in frames)
        scenes.append({"id": sid, "label": label, "cols": COLS, "rows": rows,
                       "alpha": alpha, "frames": packed})
        after = np.mean([np.mean(np.array(list(f)) != " ") for f in frames])
        report.append((sid, label, len(frames), COLS, rows, crop, after))
        print("%-11s %-12s frames=%2d grid=%dx%-3d crop=%dx%d ink %s%% -> %s%% floor=%.2f rle %d->%d"
              % (sid, label, len(frames), COLS, rows, crop[0], crop[1],
                 round(cover * 100, 1), round(float(after) * 100, 1), floor,
                 raw, sum(len(p) for p in packed)))
        if os.environ.get("DUMP"):
            print("+" + "-" * COLS + "+")
            for r in range(rows):
                print("|" + frames[len(frames) // 2][r * COLS:(r + 1) * COLS] + "|")
            print("+" + "-" * COLS + "+")

    js = ("// Generated by tools/bake_scenes.py - do not edit by hand.\n"
          "// %d ASCII scenes baked from the reference GIFs.\n" % len(scenes)) + \
         "window.SCENES=" + json.dumps(scenes, separators=(",", ":")) + ";\n"
    out = os.path.join(ROOT, "assets", "scenes.js")
    with open(out, "w", encoding="utf-8") as f:
        f.write(js)
    print("\nwrote %s  (%.1f KB)" % (out, os.path.getsize(out) / 1024))


if __name__ == "__main__":
    main()
