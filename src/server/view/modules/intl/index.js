const monadicMemoize = (fn) => {
  const cache = Object.create(null);
  const memoizedFn = (arg) => {
    const cacheKey = JSON.stringify(arg);
    if (cacheKey in cache) {
      return cache[cacheKey];
    }
    return (cache[cacheKey] = fn(arg));
  };
  return memoizedFn;
};

let locale = null;
export const getCurrentLocale = () => locale;
export const setCurrentLocale = (newLocale) => {
  locale = newLocale;
};

const getNumberFormat = monadicMemoize(({ locale, format }) => {
  return new Intl.NumberFormat(locale, format);
});
export const formatNumber = (value, { format }) => {
  const locale = getCurrentLocale();
  return getNumberFormat({ locale, format }).format(value);
};

const getDateTimeFormat = monadicMemoize(({ locale, ...options }) => {
  return new Intl.DateTimeFormat(locale, options);
});
export const formatDate = (value, options) => {
  const locale = getCurrentLocale();
  return getDateTimeFormat({ locale, options }).format(value);
};

export const formatTime = (value, options) => {
  const locale = getCurrentLocale();
  return getDateTimeFormat({ locale, options }).format(value);
};

export function __interpolate(value) {
  return value === 0 ? 0 : value || "";
}

const getPluralRules = monadicMemoize((locale) => {
  return new Intl.PluralRules(locale);
});
function getLocalPluralFor(v) {
  let locale = getCurrentLocale();
  let pluralRules = getPluralRules(locale);
  let key = pluralRules.select(v);
  return key === "other" ? "h" : key[0];
}
export function __offsetPlural(value, offset, opts) {
  return opts[value] || opts[getLocalPluralFor(value - offset)] || "";
}

export function __plural(value, opts) {
  return opts[value] || opts[getLocalPluralFor(value)] || "";
}

export function __select(value, opts) {
  return opts[value] || opts["other"] || "";
}

export function __number(value, format) {
  return formatNumber(value, { format });
}

export function __date(value, format = "short") {
  return formatDate(value, { format });
}

export function __time(value, format = "short") {
  return formatTime(value, { format });
}

export function format(message, options) {
  return typeof message === "string"
    ? message
    : message(
        ...Object.keys(options.values || {})
          .sort()
          .map((k) => options.values[k])
      );
}

export { format as _ };
