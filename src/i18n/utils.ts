import { defaultLang, routes, showDefaultLang, ui, languages } from "./ui";

export type Lang = keyof typeof ui;
type DefaultRouteMap = typeof routes[typeof defaultLang];

const ukLocalizedPages = [
  ...Object.keys(import.meta.glob("../pages/uk/*.{astro,md,mdx}", { eager: false })),
  ...Object.keys(import.meta.glob("../pages/uk/**/*.{astro,md,mdx}", { eager: false })),
]
  .map((filePath) => extractSlugFromPath(filePath, "uk"))
  .filter((slug, index, array) => array.indexOf(slug) === index);

const localizedPageSlugSets: Partial<Record<Lang, Set<string>>> = {
  uk: new Set(ukLocalizedPages),
};


function stripDynamicSegments(slug: string) {
  return slug.replace(/\[[^[\]]+\]/g, "");
}

function normalizeSlug(slug: string) {
  return stripDynamicSegments(slug).replace(/\/+/g, "/").replace(/^\//, "").replace(/\/$/, "");
}

function extractSlugFromPath(filePath: string, lang: string) {
  const rawSlug = filePath
    .replace(`../pages/${lang}`, "")
    .replace(/\.(astro|md|mdx)$/, "")
    .replace(/\/index$/, "")
    .replace(/^\//, "");

  return normalizeSlug(rawSlug);
}

function localeHasPage(lang: Lang, slug: string) {
  if (lang === defaultLang) return true;
  const normalizedSlug = normalizeSlug(slug);
  const slugSet = localizedPageSlugSets[lang];
  if (!slugSet) return false;
  if (slugSet.has(normalizedSlug)) return true;
  const baseSegment = normalizedSlug.split("/")[0] ?? "";
  return baseSegment ? slugSet.has(baseSegment) : false;
}

function normalizePathToSlug(path: string) {
  if (!path || path === "/") return "";
  return path.replace(/^\/|\/$/g, "");
}

function resolvePathFromSlug(slug: string) {
  return slug ? `/${slug}` : "/";
}

function applyTrailingSlash(path: string, shouldHaveSlash: boolean) {
  if (!shouldHaveSlash || path === "/") {
    return path;
  }

  return path.endsWith("/") ? path : `${path}/`;
}

function getKeyByValue(obj: Record<string, string>, value: string) {
  return Object.keys(obj).find((key) => obj[key] === value);
}

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang && lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function useTranslatedPath(lang: Lang) {
  return function translatePath(path: string, targetLang: Lang = lang) {
    const normalizedSlug = normalizePathToSlug(path);
    const shouldKeepTrailingSlash = path.endsWith("/") && path !== "/";
    const englishRoutes = routes[defaultLang];
    const rawSegments = normalizedSlug === "" ? [] : normalizedSlug.split("/");
    const startsWithLocale = rawSegments[0] && rawSegments[0] in languages;
    const routeSegments = startsWithLocale ? rawSegments.slice(1) : rawSegments;
    const baseSegment = routeSegments[0] ?? "";
    const remainderSegments = routeSegments.slice(1);
    const isLocaleRoot = startsWithLocale && routeSegments.length === 0;
    const lookupValue = isLocaleRoot ? "" : baseSegment || normalizedSlug;
    let routeKey = getKeyByValue(englishRoutes, lookupValue);
    if (!routeKey && normalizedSlug === "") {
      routeKey = "home";
    }

    if (!routeKey) {
      return path;
    }

    const targetRoutes = routes[targetLang];
    const englishBase = englishRoutes[routeKey as keyof DefaultRouteMap] ?? baseSegment;
    const translatedBase =
      targetLang === defaultLang ? englishBase : targetRoutes?.[routeKey as keyof DefaultRouteMap];
    const hasLocalizedBase = typeof translatedBase === "string";
    const hasLocalizedContent =
      targetLang === defaultLang || (hasLocalizedBase && localeHasPage(targetLang, translatedBase));

    if (targetLang !== defaultLang && (!hasLocalizedBase || !hasLocalizedContent)) {
      return path;
    }

    const remainder = remainderSegments.join("/");
    const baseForSlug = translatedBase ?? englishBase;
    const localizedSlug =
      remainder.length > 0
        ? `${baseForSlug ?? ""}/${remainder}`.replace(/^\/+/, "")
        : baseForSlug ?? "";
    const localizedPath = resolvePathFromSlug(localizedSlug);


    if (!showDefaultLang && targetLang === defaultLang) {
      return applyTrailingSlash(localizedPath, shouldKeepTrailingSlash);
    }

    const prefixedPath = `/${targetLang}${localizedPath}`;
    return applyTrailingSlash(prefixedPath, shouldKeepTrailingSlash);
  };
}

export function getRouteFromUrl(url: URL): string | undefined {
  const pathname = new URL(url).pathname;
  const currentLang = getLangFromUrl(url);
  const segments = pathname.split("/").filter(Boolean);
  const pathSegment = currentLang === defaultLang ? segments[0] ?? "" : segments[1] ?? "";
  const langRoutes = routes[currentLang];
  const routeKey = getKeyByValue(langRoutes, pathSegment);

  return routeKey ?? (pathSegment ? undefined : "home");
}

export function getRouteKeyFromPath(path: string) {
  const englishRoutes = routes[defaultLang];
  const slug = normalizePathToSlug(path);
  return getKeyByValue(englishRoutes, slug);
}
