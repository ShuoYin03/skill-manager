# UTM Conventions

## Naming Standard

- `utm_source`: x | reddit | github | devto | hn | ph | linkedin | hashnode
- `utm_medium`: organic | post | comment | profile
- `utm_campaign`: launch_90d
- `utm_content`: hook or creative id (example: `hook_a`, `compare_b`)

## Examples

### X post

`https://skilly-azure.vercel.app/blog/ai-coding-skills-management?utm_source=x&utm_medium=post&utm_campaign=launch_90d&utm_content=hook_a`

### Reddit comment

`https://skilly-azure.vercel.app/vs/manual-setup?utm_source=reddit&utm_medium=comment&utm_campaign=launch_90d&utm_content=compare_a`

### GitHub discussion

`https://skilly-azure.vercel.app/guides/skilly-glossary?utm_source=github&utm_medium=profile&utm_campaign=launch_90d&utm_content=guide_a`

## Rule

One post = one `utm_content` value so each creative can be compared cleanly.
