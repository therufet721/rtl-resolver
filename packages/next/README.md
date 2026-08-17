# @rtl-resolver/next

Async direction resolution for Next.js 15/16 App Router root layouts. The
package accepts promised `params` and the result of `cookies()` without loading
Next.js at runtime.

```tsx
import { cookies } from "next/headers";
import { resolveNextDirection } from "@rtl-resolver/next";
import { DirectionProvider } from "./direction-provider";

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { dir, lang } = await resolveNextDirection({ params, cookies: cookies() });
  return (
    <html dir={dir} lang={lang}>
      <body>
        <DirectionProvider locale={lang}>{children}</DirectionProvider>
      </body>
    </html>
  );
}
```

`@rtl-resolver/next` stays a Server Component helper. Put `DirectionProvider`
in a Client Component file because `@rtl-resolver/react` uses React context:

```tsx
"use client";

import { DirectionProvider } from "@rtl-resolver/react";

export { DirectionProvider };
```

Precedence is explicit direction, explicit locale, route parameter, locale
cookie, then the configured fallback.
