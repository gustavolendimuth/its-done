import createMiddleware from "next-intl/middleware";

import { locales } from "./i18n/request";

export default createMiddleware({
  // Lista de todos os locales suportados
  locales: locales,

  // Locale padrão quando nenhum coincide
  defaultLocale: "pt-BR",

  // Sempre usar prefixo de locale
  localePrefix: "never",
});

export const config = {
  // Aplicar apenas em rotas internacionalizadas
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
