# Route maps — how to write one

The Clinical "mind maps" are drawn as **route maps**, like a transit map. One JSON file per map in
`content/maps/<map id>.json` holds everything; `tools/maps/route.js` draws it three ways:

- **Poster** (wide screens, and the A3 landscape PDF): a route strip across the middle of the page, with
  note cards above and below, each joined to its station by a dotted connector.
- **Stops** (phones): the same cards as a list, zone by zone, with the line chips and the reason each stop
  is reached ("↳ from Acute OM: drum bursts").
- **Recall**: hides "You'll see / You do" so the reader can test themselves.

The reference map is `content/maps/ear-infection.json`. Read it before writing a new one.

## The idea

- **Zones** are the axis of the journey, left to right. Pick what the disease actually travels through:
  anatomical depth (nose → middle ear → mastoid → bone → skull), the clinical pathway (history → exam →
  tests → diagnosis → treatment → follow-up), time (hours → days → weeks → years), the airway from lips to
  lungs, a lump's work-up from first visit to treatment, a tumour's stage… Choose what makes the map
  *explain*, not decorate. 3–6 zones.
- **Lines** are the roads: diseases, routes of spread, or management paths. Name the lines (they form the
  legend). A short unnamed line can be a spur or a branch of a named one (same colour).
- **Stations** are the stops: a disease, a decision, a complication, a key test. Ringed stations
  (`"ix": true`) are interchanges: where lines meet or where a decision sends the patient one way or another.
- **Segment labels** say *why* the patient moves from one station to the next ("escapes the cleft",
  "won't heal", "no better at 48 h"). They are the heart of the map: the reasoning, not the facts.
- **Cards** hold the facts for each stop: a one- or two-line *why* (italic), what you'll see, what you do,
  and one warning. Every card belongs to **one** article.
- **Checkpoints**: 2–5 short cases with options and an answer (printed upside down on the poster).
- **How to ride**: 2–3 short lines telling the reader what the zones and lines mean on *this* map.

## Accuracy rules (these are checked, and an independent inspector reads every map)

1. **Every fact comes from the card's own article** (`content/clinic/<art>.txt`). Read the article fully
   first. Do not add facts from memory, even true ones. If it is not in the article, it is not on the map.
2. **Every number** on a card or checkpoint must appear in that card's article (`check_maps.py` enforces
   this). Numbers on stations, segment labels, the subtitle or How to ride must appear in one of the map's
   articles. Write doses, percentages and durations exactly as the article does.
3. **"Why" lines and segment labels** are short teaching summaries of the mechanism the article describes:
   paraphrase the article's own explanation. Never invent a mechanism or a causal link the article does not
   make. If the article gives no mechanism, describe what happens rather than why.
4. **Checkpoints** must be answerable from the card's article alone, with exactly one defensible answer.
5. Where the article cites a guideline (NICE, EPOS, ATA, UICC TNM 9…), follow it, and keep its wording
   ("consider", "offer").
6. Every abbreviation used anywhere on the map is defined in `"abbr"`, and every definition is used.
7. The old map (before this change) is a good source of short, already-checked facts:
   `git show HEAD:content/maps/<map id>.json`. Re-check each one against the article anyway.
8. **Coverage**: keep exactly the articles the old map had, in `"branches"` (`{"id": article id, "name":
   short name}`); every one needs at least one card. Do not move articles between maps.

## Schema

```json
{
 "id": "ear-infection", "title": "The infected ear", "sec": "ear", "order": 1,
 "sub": "One-line subtitle for the poster and the stops list (≤ 130 chars).",
 "branches": [{"id": "om", "name": "Otitis media"}],
 "zones": [["Nose and tube", 45], ["Middle ear cleft", 140], ...],      // name, width; widths add up to 400
 "st": {                                                                  // stations
   "aom": {"t": "Acute OM", "x": 64, "y": 17, "lab": "a", "ix": true, "dx": -9, "dy": 0}
 },
 "lines": [
   {"name": "Acute line", "c": "orange", "stops": ["cold", "tube", "aom", "mast"]},
   {"c": "orange", "w": 1.6, "stops": ["mast", "@222,17", "@234,5", "sub"]},   // spur; "@x,y" = bend point
   {"name": "Mimic spur", "c": "grey", "w": 1.4, "dash": true, "stops": ["csom", "tbo"]}
 ],
 "segs": [["aom", "mast", "escapes the cleft", 0, -2.2]],                // from, to, label, dx, dy
 "cards": [
   {"st": "aom", "art": "om", "c": "blue", "row": "top", "zone": 1, "w": 1.7,
    "t": "Acute otitis media", "tag": "interchange",
    "why": "…", "see": ["…"], "do": ["…"], "warn": "…"}
 ],
 "cells": {"top-3": "stack", "bottom-4": "stack"},                       // stack the cards of a cell vertically
 "ride": {"row": "bottom", "zone": 0, "text": ["…", "…"]},              // "first": true puts the box above its cell's cards
 "checks": {"row": "bottom", "zone": 2, "q": [{"art": "om", "q": "…", "o": ["…", "…", "…"], "a": 1}]},
 "abbr": {"AOM": "acute otitis media"}
}
```

### Geometry of the route strip

- The strip is **400 × 66** units = millimetres on the A3 poster. `x` runs 4–396, `y` 3–60.
  Zone names are printed along the bottom (y ≈ 64), so keep stations above y 60.
- Good lanes: **y 5, 17, 33, 48, 58**. Keep 12+ units between stations on one lane and leave room for
  labels (a 10-letter name is about 18 units wide at the station-name size).
- `lab`: where the station name goes: `a` above (default), `b` below, `l` left, `r` right; nudge with
  `dx`/`dy`. Station names ≤ 18 chars.
- Lines run octilinear automatically: between two stations they go straight, then 45°. Add `"@x,y"` bend
  points to steer them. Line `w` (default 3) and `dash` for spurs.
- A station's x should sit inside its zone (zones are laid out left to right by width).
- Colours (lines and cards): `blue, teal, purple, brown, green, red, orange, pink, grey`. Use one colour per
  line; cards usually take the colour of the line or topic they belong to.

### Cards

- `row`: `top` (above the strip) or `bottom`; `zone`: the column it sits in on the poster (0-based). Put a
  card in the zone of its station where possible, so its connector is short. (The phone list groups cards
  by the zone their *station* sits in.)
- `w` sets its width relative to the other cards in the same cell (default 1; 1.4+ shows See and Do side
  by side). `cells` → `"stack"` stacks a cell's cards vertically (for narrow zones).
- Limits: title ≤ 34 chars, tag ≤ 14, why ≤ 230, ≤ 6 items in see and in do, each ≤ 64 chars, warn ≤ 120.
  Aim for 8–16 cards on a map. Short keyword-style items, like the boards.
- Card titles should match the station names (the title may be longer: "Through the dura" for station
  "Dura").

## Workflow

```
python3 tools/build_maps.py --page <map id>          # renders clinic/map/<map id>.html only (safe in parallel)
python3 tools/check_maps.py <map id>                  # content + layout: must print "ok" twice
python3 tools/check_maps.py <map id> --no-layout      # content only (fast)
```

Then look at it: render `clinic/map/<map id>.html?print` (A3 poster, 1588×1123 viewport) and the page at
390 px wide (stops list) with Playwright, and look at the screenshots. The checker catches overflow,
clipped text, label collisions, lines through labels, stations on labels and missing connectors; it cannot
judge whether the map *reads well*. Fix what looks crowded or confusing.

The PDFs (`tools/make_map_pdfs.py`) and the full rebuild (`tools/build_maps.py` with no arguments) are run
once at the end, not per map.
