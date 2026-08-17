import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import {
  bdiAttributes,
  bdoAttributes,
  directionFromLocale,
  type Direction,
  type DirectionPreference,
} from "@rtl-resolver/core";

export interface DirectionContextValue {
  direction: Direction;
  locale?: string;
  setLocale: (locale: string) => void;
  setDirection: (direction: Direction) => void;
}

export interface DirectionProviderProps {
  children: ReactNode;
  locale?: string;
  direction?: Direction;
  defaultDirection?: Direction;
  persistKey?: string;
  /** Override automatic document ownership; nested providers default to false. */
  manageDocument?: boolean;
}

/** Pure SSR-safe attribute resolver for document shells and framework SSR. */
export function getDirectionAttributes(options: {
  locale?: string;
  direction?: Direction;
  defaultDirection?: Direction;
} = {}): { dir: Direction; lang?: string } {
  const dir = options.direction ?? (options.locale
    ? directionFromLocale(options.locale, options.defaultDirection ?? "ltr")
    : options.defaultDirection ?? "ltr");
  return options.locale ? { dir, lang: options.locale } : { dir };
}

export function parsePersistedDirection(raw: string | null): { locale?: string; direction?: Direction } | null {
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as { locale?: string; direction?: Direction };
    if (stored.direction && stored.direction !== "ltr" && stored.direction !== "rtl") return { locale: stored.locale };
    return stored;
  } catch {
    return null;
  }
}

const DirectionContext = createContext<DirectionContextValue | null>(null);

export function DirectionProvider({
  children,
  locale,
  direction: explicitDirection,
  defaultDirection = "ltr",
  persistKey,
  manageDocument,
}: DirectionProviderProps) {
  const parentContext = useContext(DirectionContext);
  const [currentLocale, setCurrentLocale] = useState(locale);
  const [currentDirection, setCurrentDirection] = useState<Direction>(
    explicitDirection ?? (locale ? directionFromLocale(locale, defaultDirection) : defaultDirection)
  );
  const [persistenceLoaded, setPersistenceLoaded] = useState(() => !persistKey);

  useEffect(() => {
    if (locale !== undefined) setCurrentLocale(locale);
  }, [locale]);

  useEffect(() => {
    if (explicitDirection) return;
    if (currentLocale) setCurrentDirection(directionFromLocale(currentLocale, defaultDirection));
  }, [currentLocale, defaultDirection, explicitDirection]);

  useEffect(() => {
    if (!persistKey || typeof window === "undefined") {
      setPersistenceLoaded(true);
      return;
    }
    try {
      const stored = parsePersistedDirection(window.localStorage.getItem(persistKey));
      if (locale === undefined && stored?.locale) setCurrentLocale(stored.locale);
      if (!explicitDirection && stored?.direction) setCurrentDirection(stored.direction);
    } catch {
      // Invalid or inaccessible storage is treated as no persisted preference.
    } finally {
      setPersistenceLoaded(true);
    }
  }, [explicitDirection, locale, persistKey]);

  useEffect(() => {
    if (!persistKey || !persistenceLoaded || typeof window === "undefined") return;
    window.localStorage.setItem(persistKey, JSON.stringify({ locale: currentLocale, direction: currentDirection }));
  }, [currentDirection, currentLocale, persistKey, persistenceLoaded]);

  useEffect(() => {
    if (typeof document === "undefined" || manageDocument === false || (manageDocument === undefined && Boolean(parentContext))) return;
    document.documentElement.dir = currentDirection;
    if (currentLocale) document.documentElement.lang = currentLocale;
  }, [currentDirection, currentLocale, manageDocument, parentContext]);

  const setLocale = useCallback((nextLocale: string) => {
    setCurrentLocale(nextLocale);
    if (!explicitDirection) setCurrentDirection(directionFromLocale(nextLocale, defaultDirection));
  }, [defaultDirection, explicitDirection]);

  const value = useMemo<DirectionContextValue>(() => ({
    direction: currentDirection,
    locale: currentLocale,
    setLocale,
    setDirection: setCurrentDirection,
  }), [currentDirection, currentLocale, setLocale]);

  return (
    <DirectionContext.Provider value={value}>
      <div dir={currentDirection} lang={currentLocale}>{children}</div>
    </DirectionContext.Provider>
  );
}

export function useDirection(): DirectionContextValue {
  const value = useContext(DirectionContext);
  if (!value) throw new Error("useDirection must be used inside DirectionProvider");
  return value;
}

export function DirectionAttributes({ locale, direction }: { locale?: string; direction?: Direction }) {
  const attributes = getDirectionAttributes({ locale, direction });
  return <span {...attributes} />;
}

export interface BdiProps extends Omit<HTMLAttributes<HTMLElement>, "dir"> {
  direction?: DirectionPreference;
}

/** Semantic mixed-content isolation. React performs all text/attribute escaping. */
export function Bdi({ direction = "auto", children, ...props }: BdiProps) {
  return <bdi {...props} {...bdiAttributes(direction)}>{children}</bdi>;
}

export interface BdoProps extends Omit<HTMLAttributes<HTMLElement>, "dir"> {
  direction: Direction;
}

/** Explicit bidi override for the rare cases where content order is known to be wrong. */
export function Bdo({ direction, children, ...props }: BdoProps) {
  return <bdo {...props} {...bdoAttributes(direction)}>{children}</bdo>;
}

/** Storybook 8 compatible decorator that wraps stories in DirectionProvider. */
export function DirectionStoryDecorator(
  Story: () => ReactNode,
  context?: { globals?: { direction?: Direction | "auto" } },
) {
  const preference = context?.globals?.direction ?? "ltr";
  const locale = preference === "rtl" ? "ar" : "en";
  const direction = preference === "auto" ? undefined : preference;
  return (
    <DirectionProvider locale={locale} direction={direction}>
      <Story />
    </DirectionProvider>
  );
}
