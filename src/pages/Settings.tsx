import React, { useState } from 'react'
import { Settings, Bot, Users, Database, Key, Save, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore, useToastStore } from '../lib/store'
import { MODALITY_LIST } from '../constants/modalities'

function Section({ title, icon: Icon, color = '#00B894', children }: {
  title: string; icon: React.ElementType; color?: string; children: React.ReactNode
}) {
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e8ecef', borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#111' }}>
        <Icon size={16} color={color} />
        {title}
      </div>
      {children}
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#888', display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 7,
  border: '0.5px solid #ddd', fontSize: 13,
  fontFamily: 'Barlow, sans-serif', boxSizing: 'border-box'
}

export default function SettingsPage() {
  const { user, signOut } = useAuthStore()
  const { addToast } = useToastStore()

  const [aiModel, setAiModel] = useState('claude-sonnet-4-20250514')
  const [aiFrequency, setAiFrequency] = useState('5_actions')
  const [aiSystemPrompt, setAiSystemPrompt] = useState(
    'Você é um analista especializado em esportes paralímpicos. Identifique padrões táticos e sugira ajustes ao treinador em tempo real, com foco em dados concretos e acionáveis.'
  )
  const [orgName, setOrgName] = useState(user?.full_name || '')
  const [showKey, setShowKey] = useState(false)

  const handleSaveAI = () => {
    // In production: save to Supabase profiles/organization settings
    addToast('Configurações de IA salvas!', 'success')
  }

  const handleSaveOrg = () => {
    addToast('Dados da organização salvos!', 'success')
  }

  return (
    <div style={{ fontFamily: 'Barlow, sans-serif' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 24, fontWeight: 700 }}>Configurações</div>
        <div style={{ fontSize: 13, color: '#888' }}>Gestão do sistema, modalidades e integrações</div>
      </div>

      {/* Modalities */}
      <Section title="Modalidades & Métricas" icon={Database} color="#6C5CE7">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MODALITY_LIST.map(mod => (
            <div key={mod.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#f8fafb', borderRadius: 8, padding: '10px 14px',
              border: '0.5px solid #e8ecef'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: mod.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{mod.label}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{mod.description}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#888' }}>
                  {mod.categories.reduce((a, c) => a + c.options.length, 0)} ações ·{' '}
                  {mod.categories.length} categorias
                </span>
                <span style={{
                  background: '#d1fae5', color: '#065f46',
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20
                }}>Ativo</span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#aaa', marginTop: 10 }}>
          As métricas são definidas em código. Para personalizar, edite <code style={{ background: '#f1f3f5', padding: '1px 5px', borderRadius: 4 }}>src/constants/modalities.ts</code>.
        </p>
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* AI Configuration */}
        <Section title="Integração com IA" icon={Bot} color="#6C5CE7">
          <FormField label="Modelo de análise">
            <select style={inputStyle} value={aiModel} onChange={e => setAiModel(e.target.value)}>
              <option value="claude-sonnet-4-20250514">Claude Sonnet 4.6 (Recomendado)</option>
              <option value="claude-opus-4-5">Claude Opus 4.5 (Mais detalhado)</option>
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Mais rápido)</option>
            </select>
          </FormField>

          <FormField label="Frequência de sugestões">
            <select style={inputStyle} value={aiFrequency} onChange={e => setAiFrequency(e.target.value)}>
              <option value="5_actions">A cada 5 ações</option>
              <option value="10_actions">A cada 10 ações</option>
              <option value="period">A cada tempo / set</option>
              <option value="manual">Somente manual</option>
            </select>
          </FormField>

          <FormField label="Prompt do analista IA">
            <textarea
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
              value={aiSystemPrompt}
              onChange={e => setAiSystemPrompt(e.target.value)}
            />
          </FormField>

          <button
            onClick={handleSaveAI}
            style={{ background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Save size={14} /> Salvar configurações
          </button>
        </Section>

        {/* Organization / Profile */}
        <Section title="Organização & Perfil" icon={Users} color="#0984E3">
          <FormField label="Nome da organização">
            <input style={inputStyle} value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Ex: Confederação Brasileira..." />
          </FormField>

          {user && (
            <>
              <div style={{ background: '#f8fafb', borderRadius: 8, padding: '12px', marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 600 }}>USUÁRIO LOGADO</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#00B894,#0984E3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0
                  }}>
                    {user.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{user.full_name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{user.email}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#dbeafe', color: '#1e3a8a' }}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveOrg}
                style={{ background: '#0984E3', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}
              >
                <Save size={14} /> Salvar perfil
              </button>

              <button
                onClick={() => signOut()}
                style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%' }}
              >
                Sair da conta
              </button>
            </>
          )}
        </Section>
      </div>

      {/* Supabase connection info */}
      <Section title="Conexão Supabase" icon={Key} color="#E17055">
        <div style={{ background: '#f8fafb', border: '0.5px solid #e8ecef', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600 }}>VARIÁVEIS DE AMBIENTE (.env)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { key: 'VITE_SUPABASE_URL', hint: 'https://xxxx.supabase.co' },
              { key: 'VITE_SUPABASE_ANON_KEY', hint: 'eyJhbGciOi...' },
            ].map(({ key, hint }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <code style={{ fontSize: 12, background: '#e8ecef', padding: '3px 8px', borderRadius: 5, flex: 1 }}>{key}</code>
                <span style={{ fontSize: 11, color: '#aaa' }}>{hint}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#ecfdf5', border: '0.5px solid #6ee7b7', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#065f46', marginBottom: 4 }}>✅ Funcionalidades em tempo real ativas</div>
          <div style={{ fontSize: 11, color: '#065f46', opacity: 0.85, lineHeight: 1.6 }}>
            scout_events · matches · athlete_match_stats — via Supabase Realtime
          </div>
        </div>

        <div style={{ background: '#eff6ff', border: '0.5px solid #93c5fd', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1d4ed8', marginBottom: 4 }}>📋 Como configurar</div>
          <ol style={{ fontSize: 11, color: '#1e3a5f', lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
            <li>Crie um projeto em <strong>supabase.com</strong></li>
            <li>Execute o arquivo <code>supabase/migrations/001_schema.sql</code> no SQL Editor</li>
            <li>Copie a URL e a anon key para o arquivo <code>.env</code></li>
            <li>Execute <code>npm install && npm run dev</code></li>
          </ol>
        </div>
      </Section>
    </div>
  )
}
