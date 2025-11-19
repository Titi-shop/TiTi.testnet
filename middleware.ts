import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['vi', 'en', 'zh'],
  defaultLocale: 'vi'
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
