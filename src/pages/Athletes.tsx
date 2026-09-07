import React, { useState } from 'react'
import { Plus, Search, Eye, Edit, X, User, Download } from 'lucide-react'
import { useAthletes, useCreateAthlete, useUpdateAthlete, useAthleteSeasonStats } from '../hooks/useData'
import { exportAthleteSeasonStats } from '../lib/export'
import { MODALITY_LIST } from '../constants/modalities'
import type { NewAthlete, Athlete } from '../lib/database.types'

const FUNCTIONAL_CLASSES: Record<string, string[]> = {
  goalball: ['B1', 'B2', 'B3'],
  rugby: ['0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5'],
  natacao: ['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10','S11','S12','S13','S14'],
  volei: ['SD', 'MD'],
  paracanoagem: ['KL1','KL2','KL3','VL1','VL2','VL3'],
  remo: ['PR1','PR2','PR3'],
  atletismo: ['T11','T12','T13','F11','F12','F13'],
}

const EMPTY_FORM: Partial<NewAthlete> = {
  full_name: '', birth_date: '', nationality: 'Brasil', state: '', city: '',
  email: '', phone: '', disability_type: '', disability_notes: '',
  primary_modality: 'goalball', functional_class: 'B1',
  dominant_hand: 'right', height_cm: undefined, weight_kg: undefined,
  is_active: true, notes: '',
}

export default function AthletesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedModality, setSelectedModality] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null)
  const [viewingAthlete, setViewingAthlete] = useState<Athlete | null>(null)
  const [form, setForm] = useState<Partial<NewAthlete>>(EMPTY_FORM)

  const { data: athletes = [], isLoading } = useAthletes(selectedModality || undefined)
  const createAthlete = useCreateAthlete()
  const updateAthlete = useUpdateAthlete()

  const filtered = athletes.filter((a) =>
    a.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async () => {
    if (!form.full_name || !form.primary_modality) return
    if (editingAthlete) {
      await updateAthlete.mutateAsync({ id: editingAthlete.id, data: form })
    } else {
      await createAthlete.mutateAsync(form as NewAthlete)
    }
    setShowForm(false)
    setEditingAthlete(null)
    setForm(EMPTY_FORM)
  }

  const openEdit = (athlete: Athlete) => {
    setEditingAthlete(athlete)
    setForm(athlete as any)
    setShowForm(true)
    setViewingAthlete(null)
  }

  const functionalClasses = FUNCTIONAL_CLASSES[form.primary_modality as string] || ['B1','B2','B3']

  return (
    <div style={{ fontFamily: 'Barlow, sans-serif' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar atleta..."
            style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13 }}
          />
        </div>
        <select
          value={selectedModality}
          onChange={(e) => setSelectedModality(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13 }}
        >
          <option value="">Todas modalidades</option>
          {MODALITY_LIST.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <button
          onClick={() => { setShowForm(true); setEditingAthlete(null); setForm(EMPTY_FORM) }}
          style={{
            background: '#00B894', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'Barlow', fontSize: 13, fontWeight: 600
          }}
        >
          <Plus size={15} /> Novo Atleta
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1.5px solid #00B894', borderRadius: 12, padding: '18px 20px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: 700 }}>
              {editingAthlete ? 'Editar Atleta' : 'Cadastro de Atleta'}
            </div>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Nome completo *">
              <input value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nome do atleta" />
            </Field>
            <Field label="Data de nascimento">
              <input type="date" value={form.birth_date || ''} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            </Field>
            <Field label="Modalidade principal *">
              <select value={form.primary_modality || 'goalball'} onChange={(e) => setForm({ ...form, primary_modality: e.target.value as any, functional_class: '' })}>
                {MODALITY_LIST.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </Field>
            <Field label="Classificação funcional">
              <select value={form.functional_class || ''} onChange={(e) => setForm({ ...form, functional_class: e.target.value })}>
                <option value="">— Selecionar —</option>
                {functionalClasses.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Lateralidade">
              <select value={form.dominant_hand || 'right'} onChange={(e) => setForm({ ...form, dominant_hand: e.target.value as any })}>
                <option value="right">Destro</option>
                <option value="left">Canhoto</option>
                <option value="both">Ambidestro</option>
              </select>
            </Field>
            <Field label="Estado / Cidade">
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={form.state || ''} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="UF" style={{ width: 50 }} />
                <input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Cidade" style={{ flex: 1 }} />
              </div>
            </Field>
            <Field label="Email">
              <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
            </Field>
            <Field label="Telefone / Responsável">
              <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
            </Field>
            <Field label="Altura (cm) / Peso (kg)">
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="number" value={form.height_cm || ''} onChange={(e) => setForm({ ...form, height_cm: +e.target.value })} placeholder="170" style={{ flex: 1 }} />
                <input type="number" step="0.1" value={form.weight_kg || ''} onChange={(e) => setForm({ ...form, weight_kg: +e.target.value })} placeholder="70.5" style={{ flex: 1 }} />
              </div>
            </Field>
          </div>

          <Field label="Tipo de deficiência / CID">
            <input value={form.disability_type || ''} onChange={(e) => setForm({ ...form, disability_type: e.target.value })} placeholder="Ex: CID H54 — Cegueira e visão subnormal" />
          </Field>
          <Field label="Observações médicas / histórico">
            <textarea value={form.disability_notes || ''} onChange={(e) => setForm({ ...form, disability_notes: e.target.value })} rows={3} placeholder="Detalhes sobre a deficiência, limitações específicas, histórico clínico relevante..." />
          </Field>
          <Field label="Notas do treinador">
            <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Observações táticas, comportamentais, etc..." />
          </Field>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              onClick={handleSubmit}
              disabled={createAthlete.isPending || updateAthlete.isPending}
              style={{
                background: '#00B894', color: '#fff', border: 'none', borderRadius: 8,
                padding: '9px 18px', cursor: 'pointer', fontFamily: 'Barlow', fontSize: 13, fontWeight: 600
              }}
            >
              {createAthlete.isPending || updateAthlete.isPending ? 'Salvando...' : editingAthlete ? 'Salvar alterações' : 'Cadastrar atleta'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingAthlete(null) }} style={{ background: '#f1f3f5', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontSize: 13 }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Carregando atletas...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
            <User size={40} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
            <p>Nenhum atleta encontrado.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['Atleta', 'Modalidade', 'Classificação', 'Local', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', borderBottom: '0.5px solid #e0e0e0' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((athlete) => (
                <tr key={athlete.id} style={{ borderBottom: '0.5px solid #f1f3f5' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #00B894, #0984E3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 13
                      }}>
                        {athlete.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{athlete.full_name}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>
                          {athlete.birth_date ? `${new Date().getFullYear() - new Date(athlete.birth_date).getFullYear()} anos` : ''}
                          {athlete.dominant_hand === 'left' ? ' · Canhoto' : athlete.dominant_hand === 'both' ? ' · Ambidestro' : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: '#ecfdf5', color: '#065f46', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>
                      {MODALITY_LIST.find((m) => m.id === athlete.primary_modality)?.label || athlete.primary_modality}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#444' }}>
                    {athlete.functional_class || '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#666', fontSize: 12 }}>
                    {[athlete.city, athlete.state].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      background: athlete.is_active ? '#d1fae5' : '#f1f5f9',
                      color: athlete.is_active ? '#065f46' : '#64748b',
                      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20
                    }}>
                      {athlete.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setViewingAthlete(athlete)}
                        style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => openEdit(athlete)}
                        style={{ background: '#eff6ff', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#1d4ed8' }}
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Athlete detail modal */}
      {viewingAthlete && (
        <AthleteDetailModal athlete={viewingAthlete} onClose={() => setViewingAthlete(null)} onEdit={() => openEdit(viewingAthlete)} />
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#888', display: 'block', marginBottom: 4 }}>{label}</label>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
              style: {
                ...(child.props.style || {}),
                width: (child.props as any).type === 'date' || (child.props as any).style?.width ? undefined : '100%',
                padding: '8px 10px', borderRadius: 7, border: '0.5px solid #ddd',
                fontSize: 13, fontFamily: 'Barlow, sans-serif',
                boxSizing: 'border-box' as const,
              },
            })
          : child
      )}
    </div>
  )
}

function AthleteDetailModal({ athlete, onClose, onEdit }: { athlete: Athlete; onClose: () => void; onEdit: () => void }) {
  const { data: seasonStats = [] } = useAthleteSeasonStats(athlete.id)

  const handleExport = () => {
    exportAthleteSeasonStats(seasonStats as any, athlete)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 600,
        maxHeight: '85vh', overflowY: 'auto', padding: 24, fontFamily: 'Barlow, sans-serif'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00B894, #0984E3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 18
            }}>
              {athlete.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 22, fontWeight: 700 }}>{athlete.full_name}</div>
              <div style={{ fontSize: 13, color: '#888' }}>
                {MODALITY_LIST.find((m) => m.id === athlete.primary_modality)?.label} · {athlete.functional_class}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Classificação', value: athlete.functional_class },
            { label: 'Lateralidade', value: athlete.dominant_hand === 'left' ? 'Canhoto' : athlete.dominant_hand === 'both' ? 'Ambidestro' : 'Destro' },
            { label: 'Altura', value: athlete.height_cm ? `${athlete.height_cm} cm` : '—' },
            { label: 'Peso', value: athlete.weight_kg ? `${athlete.weight_kg} kg` : '—' },
            { label: 'Estado', value: [athlete.city, athlete.state].filter(Boolean).join(' / ') || '—' },
            { label: 'Email', value: athlete.email || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#fafafa', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>

        {athlete.disability_notes && (
          <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600, marginBottom: 4 }}>Observações médicas</div>
            <div style={{ fontSize: 12, color: '#1e3a5f', lineHeight: 1.5 }}>{athlete.disability_notes}</div>
          </div>
        )}

        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          Histórico de partidas ({seasonStats.length})
        </div>
        {seasonStats.length === 0 ? (
          <p style={{ fontSize: 12, color: '#aaa' }}>Sem partidas registradas.</p>
        ) : (
          <div style={{ fontSize: 12, color: '#444' }}>
            {seasonStats.slice(0, 5).map((s: any) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid #f1f3f5' }}>
                <span>{s.matches?.home_team} vs {s.matches?.away_team}</span>
                <span style={{ color: '#00B894', fontWeight: 600 }}>{s.goals_scored} gols · {s.efficiency_pct?.toFixed(0)}% ef.</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onEdit} style={{ flex: 1, background: '#00B894', color: '#fff', border: 'none', borderRadius: 8, padding: '9px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <Edit size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />Editar
          </button>
          <button onClick={handleExport} disabled={seasonStats.length === 0} style={{ flex: 1, background: '#0984E3', color: '#fff', border: 'none', borderRadius: 8, padding: '9px', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: seasonStats.length === 0 ? 0.5 : 1 }}>
            <Download size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />Exportar Excel
          </button>
        </div>
      </div>
    </div>
  )
}
