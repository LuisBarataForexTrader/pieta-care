'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, User as UserIcon, Stethoscope, Siren, X, Users } from 'lucide-react'
import { api, setElderlyId } from '@/lib/api'
import type { BillingStatus } from '@/lib/types'
import { PLAN_LABEL, type PlanKey } from '@/lib/access'
import LockedFeatureModal from '@/components/LockedFeatureModal'

const PLAN_MAX_ELDERLY: Record<PlanKey, number> = {
  familia: 1,
  familia_plus: 2,
  cuidador_pro: 4,
}
const NEXT_TIER: Record<PlanKey, PlanKey | null> = {
  familia: 'familia_plus',
  familia_plus: 'cuidador_pro',
  cuidador_pro: null,
}

function bulletsFor(currentPlan: PlanKey, nextPlan: PlanKey): string[] {
  if (nextPlan === 'familia_plus') {
    return [
      `Cuide de até ${PLAN_MAX_ELDERLY.familia_plus} familiares no mesmo plano`,
      'Convide até 5 familiares (em vez de 2)',
      'Desbloqueie Relatório Médico, Dados Clínicos, Plano de Cuidados e Qualidade',
      'Mantém todos os dados que já registou - upgrade não apaga nada',
    ]
  }
  // -> cuidador_pro
  return [
    `Cuide de até ${PLAN_MAX_ELDERLY.cuidador_pro} familiares no mesmo plano`,
    'Convide familiares ilimitados',
    'Desbloqueie chat interno entre familiares + assistente IA',
    `Mantém o histórico completo do plano ${PLAN_LABEL[currentPlan]}`,
  ]
}

export default function NovoFamiliarPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    health_number: '',
    blood_type: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    allergies: '',
    medical_conditions: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [billing, setBilling] = useState<BillingStatus | null>(null)
  const [elderlyCount, setElderlyCount] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([api.billingStatus(), api.listElderly()])
      .then(([b, list]) => {
        setBilling(b)
        setElderlyCount(list.length)
      })
      .catch(() => {
        setBilling(null)
        setElderlyCount(0)
      })
  }, [])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload: Record<string, string | null> = {}
      Object.entries(form).forEach(([k, v]) => { payload[k] = v || null })
      const created = await api.createElderly(payload)
      setElderlyId(created.id)
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar perfil')
    } finally { setSaving(false) }
  }

  // Decide whether the user is at their plan's elderly limit. While billing
  // is still loading, render the form optimistically (no flash of paywall).
  const effectivePlan = (billing?.effective_plan ?? null) as PlanKey | null
  const planMax = effectivePlan ? PLAN_MAX_ELDERLY[effectivePlan] : null
  const billingLoaded = billing !== null && elderlyCount !== null
  const isAtLimit = billingLoaded && planMax !== null && elderlyCount! >= planMax
  const nextTier = effectivePlan ? NEXT_TIER[effectivePlan] : null

  // Plan can be upgraded → show the locked-feature modal as the takeover.
  if (isAtLimit && effectivePlan && nextTier) {
    return (
      <LockedFeatureModal
        feature={{
          path: '/novo-familiar',
          name: 'Adicionar mais familiares',
          requires: nextTier,
          icon: <Users size={28} strokeWidth={1.75} />,
          pitch: `Atingiu o limite de ${planMax} familiar${planMax === 1 ? '' : 'es'} do plano ${PLAN_LABEL[effectivePlan]}. Faça upgrade para continuar a adicionar perfis de cuidado.`,
          bullets: bulletsFor(effectivePlan, nextTier),
          current: effectivePlan,
        }}
        onClose={() => router.back()}
      />
    )
  }

  // No upgrade available → friendly limit message
  if (isAtLimit && effectivePlan) {
    return (
      <div>
        <div className="page-top">
          <div>
            <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <UserPlus size={20} strokeWidth={2} /> Novo familiar
            </div>
            <div className="page-subtitle">Adicione um novo perfil de cuidado</div>
          </div>
        </div>
        <div className="page-body">
          <div className="card card-lg" style={{ textAlign: 'center', padding: 'clamp(40px,5vw,64px) clamp(20px,3vw,40px)' }}>
            <div style={{
              width: 64, height: 64, margin: '0 auto 20px', borderRadius: 16,
              background: 'var(--warning-light)', color: 'var(--on-tinted-warning)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={28} strokeWidth={1.75} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
              Limite do plano atingido
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.6 }}>
              Já tem {planMax} familiares registados, o máximo do plano <strong>{PLAN_LABEL[effectivePlan]}</strong>.
              Para adicionar mais, contacte-nos pelo suporte.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/suporte" className="btn-primary" style={{ width: 'auto', padding: '12px 24px', textDecoration: 'none' }}>
                Falar com o suporte
              </Link>
              <button onClick={() => router.back()} className="btn-secondary" style={{ width: 'auto', padding: '12px 24px' }}>
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Normal form path
  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><UserPlus size={20} strokeWidth={2} /> Novo familiar</div>
          <div className="page-subtitle">Adicione um novo perfil de cuidado</div>
        </div>
        <button onClick={() => router.back()} className="btn-ghost" style={{ width: 'auto', padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <X size={15} strokeWidth={2.5} /> Cancelar
        </button>
      </div>

      <div className="page-body">
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-lg">
            <div className="section-title" style={{ marginBottom: 18 }}><UserIcon size={16} strokeWidth={2} style={{ color: 'var(--brand)' }} /> Dados pessoais</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label">Nome completo *</label>
                <input className="field-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Nome do familiar" required />
              </div>
              <div className="grid-2">
                <div>
                  <label className="field-label">Data de nascimento</label>
                  <input className="field-input" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Grupo sanguíneo</label>
                  <input className="field-input" value={form.blood_type} onChange={e => set('blood_type', e.target.value)} placeholder="Ex: A+, O-" />
                </div>
              </div>
              <div>
                <label className="field-label">Morada</label>
                <input className="field-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Rua, número, código postal" />
              </div>
            </div>
          </div>

          <div className="card card-lg">
            <div className="section-title" style={{ marginBottom: 18 }}><Stethoscope size={16} strokeWidth={2} style={{ color: 'var(--brand)' }} /> Saúde</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label">Nº de utente (SNS)</label>
                <input className="field-input" value={form.health_number} onChange={e => set('health_number', e.target.value)} placeholder="Ex: 123456789" />
              </div>
              <div>
                <label className="field-label">Condições médicas</label>
                <textarea className="field-input" rows={2} value={form.medical_conditions} onChange={e => set('medical_conditions', e.target.value)} placeholder="Ex: Diabetes tipo 2, hipertensão…" />
              </div>
              <div>
                <label className="field-label">Alergias</label>
                <textarea className="field-input" rows={2} value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="Ex: Penicilina, frutos secos…" />
              </div>
            </div>
          </div>

          <div className="card card-lg">
            <div className="section-title" style={{ marginBottom: 18 }}><Siren size={16} strokeWidth={2} style={{ color: '#C53030' }} /> Contacto de emergência</div>
            <div className="grid-2">
              <div>
                <label className="field-label">Nome</label>
                <input className="field-input" value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} placeholder="Ex: Ana Silva" />
              </div>
              <div>
                <label className="field-label">Telefone</label>
                <input className="field-input" type="tel" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} placeholder="+351 912 345 678" />
              </div>
            </div>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button className="btn-primary" type="submit" disabled={saving} style={{ fontSize: 15 }}>
            {saving ? 'A criar perfil…' : 'Criar perfil e continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
