'use client'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export default function Nav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [initials, setInitials] = useState('--')
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setLoggedIn(true)

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, manager_name')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        const i = ((profile.first_name?.[0] || '') + (profile.last_name?.[0] || '')).toUpperCase()
        setInitials(i || '--')
      }
    }
    load()

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/signin')
  }

  const isActive = (path) => pathname === path

  // Don't show nav on auth pages
  const hideNav = ['/signin', '/signup', '/auth/callback', '/auth/complete-profile']
  if (hideNav.includes(pathname)) return null

  return (
    <nav style={styles.nav}>
      <div style={styles.logo} onClick={() => router.push('/')}>
        FFL<span style={styles.dot}>.</span>
      </div>

      <div style={styles.links}>
        {loggedIn ? (
          <>
            <a href="/status"    style={isActive('/status')    ? styles.active : styles.link}>Status</a>
            <a href="/pick-team" style={isActive('/pick-team') ? styles.active : styles.link}>Pick Team</a>
            <a href="/transfers" style={isActive('/transfers') ? styles.active : styles.link}>Transfers</a>
            <div style={styles.userArea}>
              <div style={styles.avatar}>{initials}</div>
              <button style={styles.signOutBtn} onClick={handleSignOut}>Log Out</button>
            </div>
          </>
        ) : (
          <>
            <a href="/" style={isActive('/') ? styles.active : styles.link}>Home</a>
            <a href="/signin"  style={styles.link}>Log In</a>
            <a href="/signup"  style={styles.cta}>Join Season 1</a>
          </>
        )}
      </div>
    </nav>
  )
}

const styles = {
  nav:{ position:'sticky', top:0, background:'rgba(8,12,10,.97)', borderBottom:'1px solid #1E2E20', padding:'1rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:100, backdropFilter:'blur(10px)' },
  logo:{ fontSize:'1.4rem', fontWeight:900, color:'#00E676', letterSpacing:2, cursor:'pointer' },
  dot:{ color:'#FFD700' },
  links:{ display:'flex', alignItems:'center', gap:'.5rem' },
  link:{ color:'#5A7A5E', textDecoration:'none', fontSize:'.8rem', fontWeight:700, letterSpacing:1, textTransform:'uppercase', padding:'.4rem .8rem', borderRadius:6, transition:'color .2s' },
  active:{ color:'#00E676', textDecoration:'none', fontSize:'.8rem', fontWeight:700, letterSpacing:1, textTransform:'uppercase', padding:'.4rem .8rem', borderRadius:6, background:'rgba(0,230,118,.08)' },
  cta:{ background:'#00E676', color:'#080C0A', textDecoration:'none', fontWeight:800, fontSize:'.8rem', letterSpacing:.5, padding:'.5rem 1.2rem', borderRadius:6, transition:'all .2s' },
  userArea:{ display:'flex', alignItems:'center', gap:'.5rem', marginLeft:'.5rem', paddingLeft:'.8rem', borderLeft:'1px solid #1E2E20' },
  avatar:{ width:30, height:30, borderRadius:'50%', background:'rgba(0,230,118,.15)', border:'1px solid rgba(0,230,118,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'.68rem', color:'#00E676' },
  signOutBtn:{ background:'none', border:'none', color:'#5A7A5E', cursor:'pointer', fontSize:'.75rem', fontWeight:700 },
}