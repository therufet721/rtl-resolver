# @rtl-resolver/css

Analyze direction-sensitive CSS and suggest logical properties. Analysis is
conservative; ambiguous physical positioning is reported for manual review.

JavaScript/TypeScript sources are parsed with Babel when possible:

- `css({ marginLeft })`, `style()`, `style={{ }}`, `sx={{ }}`, and the Emotion
  `css={{ }}` prop
- tagged templates (`css`, `styled`, `keyframes`, …) and `css(() => \`...\`)`
  callbacks
- kebab-case object keys such as `"margin-left"`
- TypeScript type literals such as `type Pos = { left: number }` are not flagged

`migrateSource` applies the same safe margin/padding/border/`text-align`
rewrites inside those templates and style objects. Analysis follows same-file
identifier spreads and computed string keys. It does not rewrite `left` /
`right`, execute interpolations, or follow unknown CSS-in-JS factories.

`*.module.css` files skip ICSS chrome (`:export`, `:import`, `@value`,
`composes`) and class-name utilities. Real declarations such as `margin-left`
inside a module still flag. Four-value `padding` / `margin` / `inset` shorthands
are review-only.
