'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, RefreshCw, ArrowRight, AlertCircle } from 'lucide-react'
import { api, getElderlyId } from '@/lib/api'

interface Insights {
  generated_at: string
  markdown: string
}

function renderInsights(text: string) {
  const out: { kind: 'h' | 'p' | 'li'; text: string }[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  for (const line of lines) {
    if (/^\*\*(.+?)\*\*:?$/.test(line)) {
      const m = line.match(/^\*\*(.+?)\*\*:?$/)!
      out.push({ kind: 'h', text: m[1].trim() })
    } else if (/^[\*\-•]\s+/.test(line)) {
      out.push({ kind: 'li', text: line.replace(/^[\*\-•]\s+/, '') })
    } else if (/^\*\*Aviso:?\*\*/i.test(line)) {
      out.push({ kind: 'p', text: line.replace(/^\*\*Aviso:?\*\*\s*/i, '⚠ ') })
    } else {
      out.push({ kind: 'p', text: line.replace(/\*\*(.+?)\*\*/g, '$1') })
    }
  }
  return out
}

export default function AIInsightsPanel() {
  const [insights, setInsights] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paywall, setPaywall] = useState(false)

  async function generate() {
    const elderlyId = getElderlyId()
    if (!elderlyId) return
    setLoading(true)
    setError(null)
    setPaywall(false)
    try {
      const res = await api.aiInsights(elderlyId)
      setInsights({ generated_at: res.generated_at, markdown: res.markdown })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro a gerar insights'
      if (msg.toLowerCase().includes('família plus') || msg.toLowerCase().includes('upgrade')) {
        setPaywall(true)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (paywall) {
    return (
      <div className="ai-panel ai-panel-locked">
        <div className="ai-panel-head">
          <div className="ai-panel-badge">
            <Sparkles size={12} strokeWidth={2.5} /> IA · Família Plus
          </div>
          <div className="ai-panel-title">Insights clínicos automáticos</div>
        </div>
        <p className="ai-panel-body">
          Disponível no plano <strong>Família Plus</strong>: análise inteligente dos sinais vitais,
          adesão à medicação, bem-estar e incidentes dos últimos 7 dias.
        </p>
        <Link href="/conta" className="ai-panel-cta">
          Fazer upgrade <ArrowRight size={14} strokeWidth={2.5} />
        </Link>
      </div>
    )
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-head">
        <div className="ai-panel-badge">
          <Sparkles size={12} strokeWidth={2.5} /> IA · Insights
        </div>
        <div className="ai-panel-title">Análise dos últimos 7 dias</div>
      </div>

      {!insights && !loading && !error && (
        <>
          <p className="ai-panel-body">
            Gera uma análise inteligente que combina sinais vitais, adesão à medicação,
            bem-estar e incidentes recentes — em 5 segundos, em linguagem clara.
          </p>
          <button onClick={generate} className="ai-panel-cta">
            <Sparkles size={14} strokeWidth={2.5} /> Gerar análise
          </button>
        </>
      )}

      {loading && (
        <div className="ai-panel-loading">
          <Sparkles size={18} strokeWidth={2.25} className="ai-panel-spin" />
          <span>A analisar dados…</span>
        </div>
      )}

      {error && (
        <div className="ai-panel-error">
          <AlertCircle size={14} strokeWidth={2.25} /> {error}
          <button onClick={generate} className="ai-panel-retry">tentar de novo</button>
        </div>
      )}

      {insights && (
        <div className="ai-panel-result">
          {renderInsights(insights.markdown).map((b, i) => {
            if (b.kind === 'h') return <div key={i} className="ai-panel-h">{b.text}</div>
            if (b.kind === 'li') return <div key={i} className="ai-panel-li">• {b.text}</div>
            return <p key={i} className="ai-panel-p">{b.text}</p>
          })}
          <div className="ai-panel-footer">
            <span>Gerado {new Date(insights.generated_at).toLocaleString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            <button onClick={generate} className="ai-panel-refresh" disabled={loading}>
              <RefreshCw size={11} strokeWidth={2.25} /> Actualizar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
