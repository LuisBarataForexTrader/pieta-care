import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getArticle, getAllSlugs } from '@/lib/articles'
import { ArrowLeft, Clock, ArrowRight, CheckCircle2 } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return {}
  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: { canonical: `/guias/${slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      publishedTime: article.date,
    },
  }
}

const CATEGORY_LABEL: Record<string, string> = {
  guia: 'Guia',
  comparar: 'Comparação',
}

const CATEGORY_COLOR: Record<string, string> = {
  guia: 'bg-[#2A6049]/10 text-[#2A6049]',
  comparar: 'bg-amber-100 text-amber-800',
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    author: { '@type': 'Organization', name: 'pietas.care' },
    publisher: {
      '@type': 'Organization',
      name: 'pietas.care',
      url: 'https://pietas.care',
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://pietas.care/guias/${slug}` },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen bg-white">
        {/* Top green accent */}
        <div className="h-1 bg-gradient-to-r from-[#2A6049] to-[#4a9e7a]" />

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/guias"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2A6049] transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Todos os guias
          </Link>

          {/* Article header */}
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${CATEGORY_COLOR[article.category] ?? 'bg-gray-100 text-gray-700'}`}>
                {CATEGORY_LABEL[article.category] ?? article.category}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                {article.readingTime} min de leitura
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl leading-tight">
              {article.title}
            </h1>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              {article.description}
            </p>
            <time className="mt-4 block text-sm text-gray-400">
              Publicado a {new Date(article.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </time>
          </header>

          {/* Inline CTA (soft — mid-article) */}
          <div className="mb-10 rounded-xl border border-[#2A6049]/20 bg-[#2A6049]/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Experimente a pietas.care grátis durante 14 dias</p>
              <p className="text-xs text-gray-500 mt-0.5">Medicação, consultas e sinais vitais — tudo partilhado com a família.</p>
            </div>
            <Link
              href="/register"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#2A6049] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e4a38] transition-colors"
            >
              Começar grátis
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Article content */}
          <article
            className="prose prose-gray max-w-none
              prose-headings:font-semibold prose-headings:text-gray-900
              prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-a:text-[#2A6049] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-li:text-gray-700 prose-li:marker:text-[#2A6049]
              prose-table:text-sm prose-th:bg-gray-50 prose-th:font-semibold
              prose-hr:border-gray-200
              prose-blockquote:border-[#2A6049] prose-blockquote:text-gray-600"
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />

          {/* Bottom CTA (strong) */}
          <div className="mt-14 rounded-2xl bg-[#2A6049] p-8 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold">Pronto para simplificar os cuidados?</h2>
                <p className="mt-2 text-white/80 text-sm">
                  Junte-se a famílias que já usam a pietas.care para coordenar os cuidados aos seus pais.
                </p>
                <ul className="mt-4 space-y-1.5">
                  {['14 dias grátis, sem cartão', 'Toda a família num só lugar', 'Suporte em português'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-white/90">
                      <CheckCircle2 className="h-4 w-4 text-white/70 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3 shrink-0">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#2A6049] hover:bg-gray-50 transition-colors"
                >
                  Começar grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/planos"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white/90 hover:border-white/60 transition-colors"
                >
                  Ver planos e preços
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
