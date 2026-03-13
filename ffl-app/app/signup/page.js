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

  
  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>FFL<span style={styles.dot}>.</span></div>
        <div style={styles.tagline}>Fantasy FUNAAB League · Season 1</div>
        <div style={styles.title}>Create Account</div>
        <div style={styles.sub}>Join 312+ managers. N500 entry. Top 3 win real prizes.</div>

        {message && <div style={styles.alert}>{message}</div>}

        

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



const styles = {
  wrap:{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#080C0A', padding:'2rem 1rem' },
  card:{ background:'#111A13', border:'1px solid #1E2E20', borderRadius:18, padding:'2.5rem 2rem', width:'100%', maxWidth:440, boxShadow:'0 40px 80px rgba(0,0,0,.5)' },
  logo:{ fontFamily:'sans-serif', fontSize:'1.5rem', fontWeight:900, color:'#00E676', textAlign:'center', marginBottom:4, letterSpacing:2 },
  dot:{ color:'#FFD700' },
  tagline:{ textAlign:'center', fontSize:'.72rem', color:'#5A7A5E', marginBottom:'1.5rem' },
  title:{ fontFamily:'sans-serif', fontWeight:800, fontSize:'1.8rem', textAlign:'center', color:'#E8F5E9', marginBottom:4 },
  sub:{ textAlign:'center', fontSize:'.82rem', color:'#5A7A5E', marginBottom:'1.5rem' },
  alert:{ background:'rgba(0,230,118,.1)', border:'1px solid rgba(0,230,118,.3)', borderRadius:8, padding:'.7rem 1rem', fontSize:'.8rem', color:'#00E676', marginBottom:'1rem' },
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