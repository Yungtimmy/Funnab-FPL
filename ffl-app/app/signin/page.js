'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignIn() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }))

  const validate = () => {
    const e = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSignIn = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    })

    setLoading(false)

    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else {
      router.push('/status')
    }
  }

 
  const handleForgot = async () => {
    if (!form.email) {
      setErrors({ email: 'Enter your email above first' })
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(form.email)
    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else {
      setMessage({ text: 'Password reset link sent. Check your email.', type: 'success' })
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>FFL<span style={styles.dot}>.</span></div>
        <div style={styles.tagline}>Fantasy FUNAAB League · Season 1</div>
        <div style={styles.title}>Welcome Back</div>
        <div style={styles.sub}>Log in to manage your squad and track your points.</div>

        {message.text && (
          <div style={{ ...styles.alert, ...(message.type === 'error' ? styles.alertError : styles.alertSuccess) }}>
            {message.text}
          </div>
        )}

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Email Address</label>
          <input
            style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => update('email', e.target.value)}
          />
          {errors.email && <div style={styles.errMsg}>{errors.email}</div>}
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Password</label>
          <PasswordField
            value={form.password}
            onChange={v => update('password', v)}
            error={errors.password}
          />
        </div>

        <div style={styles.forgot}>
          <span onClick={handleForgot} style={styles.forgotLink}>Forgot password?</span>
        </div>

        <button style={styles.submit} onClick={handleSignIn} disabled={loading}>
          {loading ? 'Logging in...' : 'Log In to FFL'}
        </button>

        <div style={styles.terms}>
          By continuing you agree to our Terms and Privacy Policy.
        </div>
        <div style={styles.switch}>
          Don't have an account? <a href="/signup" style={styles.link}>Create one free</a>
        </div>
      </div>
    </div>
  )
}

function PasswordField({ value, onChange, error }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        style={{ ...styles.input, paddingRight: '4rem', ...(error ? styles.inputError : {}) }}
        type={show ? 'text' : 'password'}
        placeholder="Your password"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <button style={styles.toggle} onClick={() => setShow(s => !s)}>
        {show ? 'Hide' : 'Show'}
      </button>
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
  sub:{ textAlign:'center', fontSize:'.82rem', color:'#5A7A5E', marginBottom:'1.5rem' },
  alert:{ borderRadius:8, padding:'.7rem 1rem', fontSize:'.8rem', marginBottom:'1rem' },
  alertSuccess:{ background:'rgba(0,230,118,.1)', border:'1px solid rgba(0,230,118,.3)', color:'#00E676' },
  alertError:{ background:'rgba(239,154,154,.1)', border:'1px solid rgba(239,154,154,.3)', color:'#EF9A9A' },
  fieldGroup:{ marginBottom:'1rem' },
  label:{ display:'block', fontSize:'.72rem', fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#5A7A5E', marginBottom:'.4rem' },
  input:{ width:'100%', background:'#0D1410', border:'1px solid #1E2E20', borderRadius:9, padding:'.75rem 1rem', color:'#E8F5E9', fontSize:'.9rem', outline:'none', boxSizing:'border-box' },
  inputError:{ borderColor:'rgba(239,154,154,.5)' },
  toggle:{ position:'absolute', right:'.9rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#5A7A5E', cursor:'pointer', fontSize:'.72rem', fontWeight:700 },
  forgot:{ textAlign:'right', marginBottom:'1rem', marginTop:'-.5rem' },
  forgotLink:{ fontSize:'.75rem', color:'#5A7A5E', cursor:'pointer' },
  submit:{ width:'100%', background:'#00E676', color:'#080C0A', fontWeight:800, fontSize:'.95rem', padding:'.9rem', border:'none', borderRadius:10, cursor:'pointer', marginTop:'.4rem' },
  terms:{ textAlign:'center', fontSize:'.68rem', color:'#5A7A5E', marginTop:'.9rem', lineHeight:1.6 },
  switch:{ textAlign:'center', marginTop:'1.2rem', fontSize:'.8rem', color:'#5A7A5E', paddingTop:'1rem', borderTop:'1px solid #1E2E20' },
  link:{ color:'#00E676', fontWeight:700, textDecoration:'none' },
}
