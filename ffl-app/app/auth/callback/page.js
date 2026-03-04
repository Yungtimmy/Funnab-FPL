'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    async function handleCallback() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/signin')
        return
      }

      // Check if profile is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('manager_name')
        .eq('id', session.user.id)
        .single()

      if (!profile?.manager_name) {
        // New Google user — needs to complete profile
        router.push('/auth/complete-profile')
      } else {
        // Existing user — go straight to dashboard
        router.push('/status')
      }
    }

    handleCallback()
  }, [])

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>FFL<span style={styles.dot}>.</span></div>
        <div style={styles.text}>Connecting your account...</div>
        <div style={styles.spinner}></div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const styles = {
  wrap:{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#080C0A' },
  card:{ background:'#111A13', border:'1px solid #1E2E20', borderRadius:18, padding:'3rem 2rem', width:'100%', maxWidth:380, textAlign:'center', boxShadow:'0 40px 80px rgba(0,0,0,.5)' },
  logo:{ fontFamily:'sans-serif', fontSize:'1.5rem', fontWeight:900, color:'#00E676', marginBottom:'1.5rem', letterSpacing:2 },
  dot:{ color:'#FFD700' },
  text:{ color:'#5A7A5E', fontSize:'.9rem', marginBottom:'1.5rem' },
  spinner:{ width:32, height:32, border:'3px solid #1E2E20', borderTop:'3px solid #00E676', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto' },
}