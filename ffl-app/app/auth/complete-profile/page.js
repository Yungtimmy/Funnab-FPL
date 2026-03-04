'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CompleteProfile() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', managerName: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/signin'); return }
      setSession(session)

      // Pre-fill name from Google account
      const fullName = session.user.user_metadata?.full_name || ''
      const parts = fullName.split(' ')
      setForm(f => ({
        ...f,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || ''
      }))
    }
    getSession()
  }, [])

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }))

  const validate = () => {
    const e = {}
    if (!form.firstName) e.firstName = 'Required'
    if (!form.lastName) e.lastName = 'Required'
    if (form.managerName.length < 3) e.managerName = 'Min 3 characters'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        first_name: form.firstName,
        last_name: form.lastName,
        manager_name: form.managerName
      })

    setLoading(false)

    if (error) {
      setMessage(error.message)
    } else {
      router.push('/status')
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>FFL<span style={styles.dot}>.</span></div>
        <div style={styles.tagline}>Fantasy FUNAAB League · Season 1</div>
        <div style={styles.title}>Almost There</div>
        <div style={styles.sub}>Your Google account is connected. Just fill in a few details to complete your profile.</div>

        {/* Google verified strip */}
        {session && (
          <div style={styles.verified}>
            <div style={styles.verifiedAvatar}>
              {(session.user.user_metadata?.full_name || 'G')[0].toUpperCase()}
            </div>
            <div style={styles.verifiedInfo}>
              <div style={styles.verifiedName}>{session.user.user_metadata?.full_name || 'Google User'}</div>
              <div style={styles.verifiedEmail}>{session.user.email}</div>
            </div>
            <div style={styles.verifiedCheck}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="#080C0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        )}

        {message && <div style={styles.alert}>{message}</div>}

        <div style={styles.row}>
          <Field label="First Name" placeholder="Adaora" value={form.firstName} onChange={v => update('firstName', v)} error={errors.firstName} />
          <Field label="Last Name" placeholder="Eze" value={form.lastName} onChange={v => update('lastName', v)} error={errors.lastName} />
        </div>
        <div style={{ height: '.9rem' }}></div>

        <Field
          label="Manager Username"
          placeholder="e.g. Adaora_Owls"
          value={form.managerName}
          onChange={v => update('managerName', v)}
          error={errors.managerName}
          hint="This is how other managers will see you on the leaderboard"
        />

        <button style={styles.submit} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving profile...' : 'Complete Profile'}
        </button>

        <div style={styles.terms}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  )
}

function Field({ label, placeholder, value, onChange, error, hint }) {
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <input
        style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {hint && <div style={styles.hint}>{hint}</div>}
      {error && <div style={styles.errMsg}>{error}</div>}
    </div>
  )
}

const styles = {
  wrap:{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#080C0A', padding:'2rem 1rem' },
  card:{ background:'#111A13', border:'1px solid #1E2E20', borderRadius:18, padding:'2.5rem 2rem', width:'100%', maxWidth:440, boxShadow:'0 40px 80px rgba(0,0,0,.5)' },
  logo:{ fontFamily:'sans-serif', fontSize:'1.5rem', fontWeight:900, color:'#00E676', textAlign:'center', marginBottom:4, letterSpacing:2 },
  dot:{ color:'#FFD700' },
  tagline:{ textAlign:'center', fontSize:'.72rem', color:'#5A7A5E', marginBottom:'1.5rem' },
  title:{ fontWeight:800, fontSize:'1.8rem', textAlign:'center', color:'#E8F5E9', marginBottom:4 },
  sub:{ textAlign:'center', fontSize:'.82rem', color:'#5A7A5E', marginBottom:'1.5rem', lineHeight:1.5 },
  verified:{ display:'flex', alignItems:'center', gap:'.8rem', background:'rgba(0,230,118,.06)', border:'1px solid rgba(0,230,118,.2)', borderRadius:10, padding:'.9rem 1rem', marginBottom:'1.5rem' },
  verifiedAvatar:{ width:38, height:38, borderRadius:'50%', background:'rgba(0,230,118,.15)', border:'1px solid rgba(0,230,118,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'.85rem', color:'#00E676', flexShrink:0 },
  verifiedInfo:{ flex:1 },
  verifiedName:{ fontWeight:700, fontSize:'.88rem', color:'#E8F5E9' },
  verifiedEmail:{ fontSize:'.72rem', color:'#5A7A5E', marginTop:2 },
  verifiedCheck:{ width:18, height:18, background:'#00E676', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  alert:{ background:'rgba(239,154,154,.1)', border:'1px solid rgba(239,154,154,.3)', borderRadius:8, padding:'.7rem 1rem', fontSize:'.8rem', color:'#EF9A9A', marginBottom:'1rem' },
  row:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.8rem' },
  fieldGroup:{ marginBottom:'1rem' },
  label:{ display:'block', fontSize:'.72rem', fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#5A7A5E', marginBottom:'.4rem' },
  input:{ width:'100%', background:'#0D1410', border:'1px solid #1E2E20', borderRadius:9, padding:'.75rem 1rem', color:'#E8F5E9', fontSize:'.9rem', outline:'none', boxSizing:'border-box' },
  inputError:{ borderColor:'rgba(239,154,154,.5)' },
  hint:{ fontSize:'.7rem', color:'#5A7A5E', marginTop:'.3rem' },
  errMsg:{ fontSize:'.7rem', color:'#EF9A9A', marginTop:'.3rem' },
  submit:{ width:'100%', background:'#00E676', color:'#080C0A', fontWeight:800, fontSize:'.95rem', padding:'.9rem', border:'none', borderRadius:10, cursor:'pointer', marginTop:'.4rem' },
  terms:{ textAlign:'center', fontSize:'.68rem', color:'#5A7A5E', marginTop:'.9rem', lineHeight:1.6 },
}