'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SignUp() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', managerName: '', email: '', password: '', confirm: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }))

  const validate = () => {
    const e = {}
    if (!form.firstName) e.firstName = 'Required'
    if (!form.lastName) e.lastName = 'Required'
    if (form.managerName.length < 3) e.managerName = 'Min 3 characters'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (form.password.length < 8) e.password = 'Min 8 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          manager_name: form.managerName
        }
      }
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Account created! Check your email to confirm.')
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>FFL<span style={styles.dot}>.</span></div>
        <div style={styles.tagline}>Fantasy FUNAAB League · Season 1</div>
        <div style={styles.title}>Create Account</div>
        <div style={styles.sub}>Join 312+ managers. N500 entry. Top 3 win real prizes.</div>

        {message && <div style={styles.alert}>{message}</div>}

        <button style={styles.googleBtn} onClick={handleGoogle}>
          <GoogleIcon />
          Continue with Google
        </button>

        <div style={styles.divider}><span>or sign up with email</span></div>

        <div style={styles.row}>
          <Field label="First Name" placeholder="Adaora" value={form.firstName} onChange={v => update('firstName', v)} error={errors.firstName} />
          <Field label="Last Name" placeholder="Eze" value={form.lastName} onChange={v => update('lastName', v)} error={errors.lastName} />
        </div>

        <Field label="Manager Username" placeholder="e.g. Adaora_Owls" value={form.managerName} onChange={v => update('managerName', v)} error={errors.managerName} hint="Shown on the leaderboard" />
        <Field label="Email Address" placeholder="you@example.com" type="email" value={form.email} onChange={v => update('email', v)} error={errors.email} />
        <Field label="Password" placeholder="Min. 8 characters" type="password" value={form.password} onChange={v => update('password', v)} error={errors.password} />
        <Field label="Confirm Password" placeholder="Repeat password" type="password" value={form.confirm} onChange={v => update('confirm', v)} error={errors.confirm} />

        <button style={styles.submit} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <div style={styles.terms}>By signing up you agree to our Terms and Privacy Policy. N500 entry fee due after signup.</div>
        <div style={styles.switch}>Already have an account? <a href="/signin" style={styles.link}>Log in</a></div>
      </div>
    </div>
  )
}

function Field({ label, placeholder, type='text', value, onChange, error, hint }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
          type={isPassword && show ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        {isPassword && (
          <button style={styles.toggle} onClick={() => setShow(s => !s)}>
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {hint && <div style={styles.hint}>{hint}</div>}
      {error && <div style={styles.errMsg}>{error}</div>}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

const styles = {
  wrap:{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#080C0A', padding:'2rem 1rem' },
  card:{ background:'#111A13', border:'1px solid #1E2E20', borderRadius:18, padding:'2.5rem 2rem', width:'100%', maxWidth:440, boxShadow:'0 40px 80px rgba(0,0,0,.5)' },
  logo:{ fontFamily:'sans-serif', fontSize:'1.5rem', fontWeight:900, color:'#00E676', textAlign:'center', marginBottom:4, letterSpacing:2 },
  dot:{ color:'#FFD700' },
  tagline:{ textAlign:'center', fontSize:'.72rem', color:'#5A7A5E', marginBottom:'1.5rem' },
  title:{ fontFamily:'sans-serif', fontWeight:800, fontSize:'1.8rem', textAlign:'center', color:'#E8F5E9', marginBottom:4 },
  sub:{ textAlign:'center', fontSize:'.82rem', color:'#5A7A5E', marginBottom:'1.5rem' },
  alert:{ background:'rgba(0,230,118,.1)', border:'1px solid rgba(0,230,118,.3)', borderRadius:8, padding:'.7rem 1rem', fontSize:'.8rem', color:'#00E676', marginBottom:'1rem' },
  googleBtn:{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#0D1410', border:'1px solid #1E2E20', borderRadius:10, padding:'.85rem', cursor:'pointer', fontSize:'.88rem', fontWeight:700, color:'#E8F5E9', marginBottom:'1.2rem' },
  divider:{ display:'flex', alignItems:'center', gap:'.8rem', marginBottom:'1.2rem', color:'#5A7A5E', fontSize:'.68rem', fontWeight:700, letterSpacing:2, textTransform:'uppercase' },
  row:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.8rem' },
  fieldGroup:{ marginBottom:'1rem' },
  label:{ display:'block', fontSize:'.72rem', fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#5A7A5E', marginBottom:'.4rem' },
  input:{ width:'100%', background:'#0D1410', border:'1px solid #1E2E20', borderRadius:9, padding:'.75rem 1rem', color:'#E8F5E9', fontSize:'.9rem', outline:'none', boxSizing:'border-box' },
  inputError:{ borderColor:'rgba(239,154,154,.5)' },
  toggle:{ position:'absolute', right:'.9rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#5A7A5E', cursor:'pointer', fontSize:'.72rem', fontWeight:700 },
  hint:{ fontSize:'.7rem', color:'#5A7A5E', marginTop:'.3rem' },
  errMsg:{ fontSize:'.7rem', color:'#EF9A9A', marginTop:'.3rem' },
  submit:{ width:'100%', background:'#00E676', color:'#080C0A', fontWeight:800, fontSize:'.95rem', padding:'.9rem', border:'none', borderRadius:10, cursor:'pointer', marginTop:'.4rem' },
  terms:{ textAlign:'center', fontSize:'.68rem', color:'#5A7A5E', marginTop:'.9rem', lineHeight:1.6 },
  switch:{ textAlign:'center', marginTop:'1.2rem', fontSize:'.8rem', color:'#5A7A5E', paddingTop:'1rem', borderTop:'1px solid #1E2E20' },
  link:{ color:'#00E676', fontWeight:700, textDecoration:'none' },
}