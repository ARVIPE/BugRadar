// src/i18n/request.ts
import {getRequestConfig} from "next-intl/server";

const DEFAULT_LOCALE = "en";

export default getRequestConfig(async ({locale}) => {
  const activeLocale = locale ?? DEFAULT_LOCALE;

  return {
    locale: activeLocale,
    messages: (await import(`../../messages/${activeLocale}.json`)).default,
  };
});
