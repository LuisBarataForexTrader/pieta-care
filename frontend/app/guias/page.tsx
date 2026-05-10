import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllArticles } from '@/lib/articles'
import { BookOpen, Clock, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Guias de Cuidados a Idosos',
  description: 'Artigos práticos para famílias que cuidam de pais idosos em Portugal: medicação, consultas, saúde, coordenação familiar e muito mais.',
  alternates: { canonical: '/guias' },
}

const CATEGORY_LABEL: Record<string, string> = {
  guia: 'Guia',
  comparar: 'Comparação',
}

const CATEGORY_COLOR: Record<string, string> = {
  guia: 'bg-sage-100 text-sage-800',
  comparar: 'bg-amber-100 text-amber-800',
}

export default function GuiasPage() {
  const articles = getAllArticles()

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A6049]/10">
              <BookOpen className="h-5 w-5 text-[#2A6049]" />
            </div>
            <span className="text-sm font-medium text-[#2A6049] uppercase tracking-wide">Guias</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Cuidar bem começa por saber mais
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl">
            Artigos práticos escritos para famílias que cuidam de pais idosos — sem jargão médico, sem respostas genéricas.
          </p>
        </div>
      </div>

      {/* Articles grid */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {articles.length === 0 ? (
          <p className="text-gray-500 text-center py-16">Nenhum artigo publicado ainda.</p>
        ) : (
          <div className="space-y-6">
            {articles.map(article => (
              <Link
                key={article.slug}
                href={`/guias/${article.slug}`}
                className="group block rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-[#2A6049]/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLOR[article.category] ?? 'bg-gray-100 text-gray-700'}`}>
                        {CATEGORY_LABEL[article.category] ?? article.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {article.readingTime} min de leitura
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#2A6049] transition-colors leading-snug">
                      {article.title}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                      {article.description}
                    </p>
                    <time className="mt-3 block text-xs text-gray-400">
                      {new Date(article.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </time>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#2A6049] shrink-0 mt-1 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 rounded-2xl bg-[#2A6049]/5 border border-[#2A6049]/10 p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900">Pronto para experimentar a pietas.care?</h2>
          <p className="mt-2 text-gray-600">14 dias grátis. Sem cartão de crédito. Cancelamento a qualquer momento.</p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2A6049] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1e4a38] transition-colors"
            >
              Começar grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/planos"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:border-[#2A6049]/40 transition-colors"
            >
              Ver planos
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
