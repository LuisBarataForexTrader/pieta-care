import type { MetadataRoute } from 'next'

/** robots.txt exposed at /robots.txt.
 *  Allow everything indexable; explicitly disallow authenticated/admin
 *  surfaces so Googlebot doesn't waste crawl budget on them.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/conta',
          '/saude',
          '/medicacao',
          '/calendario',
          '/incidentes',
          '/documentos',
          '/notas',
          '/perfil',
          '/familia',
          '/chat',
          '/qualidade',
          '/relatorio',
          '/plano',
          '/admin/',
          '/avaliacao',
          '/api/',
          '/uploads/',
        ],
      },
    ],
    sitemap: 'https://pietas.care/sitemap.xml',
    host: 'https://pietas.care',
  }
}
