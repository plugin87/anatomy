# iso-explainer

Claude Code skill: explain a technical idea as a live isometric machine. The object is the explanation.

- `SKILL.md`: the workflow and craft rules (Thai)
- `kit/iso.mjs`: zero-dependency kit (camera, four-tone solids, card, page, runtime, theme tokens)
- `examples/token-bucket/`: a token-bucket rate limiter drawn as a coin dispenser
- `examples/debounce/`: a trailing debounce drawn as a dashpot time-delay switch
- `examples/bangkok-bts/`: a 1:300 model of a Bangkok street with a BTS Skytrain station
- build either with `node examples/<name>/build.mjs`
- `scripts/shoot.mjs`, `scripts/check.mjs`: headless-Chrome screenshots and static checks

Install: copy or symlink this folder to `~/.claude/skills/iso-explainer`.

Inspired by the ideas in [anatomy](https://github.com/wheresryan22/anatomy) by Ryan (MIT). This kit and its example are written from scratch.
