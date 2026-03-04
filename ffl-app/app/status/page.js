'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Status() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState({ d:'--', h:'--', m:'--', s:'--' })

  const DEADLINE = new Date('2026-03-15T23:59:00')

  // Auth check + fetch profile
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/signin'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profile)
      setLoading(false)
    }
    load()
  }, [])

  // Countdown timer
  useEffect(() => {
    const tick = () => {
      const diff = DEADLINE - new Date()
      if (diff <= 0) return
      const p = n => String(Math.max(0, n)).padStart(2, '0')
      setCountdown({
        d: p(Math.floor(diff / 86400000)),
        h: p(Math.floor((diff % 86400000) / 3600000)),
        m: p(Math.floor((diff % 3600000) / 60000)),
        s: p(Math.floor((diff % 60000) / 1000))
      })
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/signin')
  }

  if (loading) return (
    <div style={styles.loadWrap}>
      <div style={styles.spinner}></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const initials = ((profile?.first_name?.[0] || '') + (profile?.last_name?.[0] || '')).toUpperCase()

  const leaderboard = [
    { rank: 1, name: profile?.manager_name || 'You', team: 'Federal Eagles FC', pts: 1241, prize: '50%', you: true },
    { rank: 2, name: 'KasimTactician', team: 'COLBIOS United', pts: 1198, prize: '30%', you: false },
    { rank: 3, name: 'FunaBoss', team: 'SAAT Rangers', pts: 1177, prize: '20%', you: false },
    { rank: 4, name: 'Zainab_Manager', team: 'COLANIM Wolves', pts: 1103, prize: null, you: false },
    { rank: 5, name: 'EzePicker', team: 'EMS Gladiators', pts: 1089, prize: null, you: false },
  ]

  return (
    <div style={styles.wrap}>
     

      <div style={styles.content}>

        {/* Welcome card */}
        <div style={styles.welcomeCard}>
          <div>
            <div style={styles.greeting}>Welcome back, Manager</div>
            <div style={styles.username}>{profile?.manager_name || 'Manager'}</div>
            <div style={styles.teamName}>Federal Eagles FC</div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Current Gameweek</div>
            <div style={{ ...styles.statVal, color: '#E8F5E9' }}>GW 3</div>
            <div style={styles.statSub}>of 15 total gameweeks</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Points</div>
            <div style={{ ...styles.statVal, color: '#00E676' }}>1,241</div>
            <div style={styles.statSub}>+84 this gameweek</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Overall Rank</div>
            <div style={{ ...styles.statVal, color: '#FFD700' }}>#1</div>
            <div style={styles.statSub}>of 312 managers</div>
          </div>
        </div>

        {/* Countdown */}
        <div style={styles.cdCard}>
          <div style={styles.cdTop}>
            <div>
              <div style={styles.cdLabel}>Next Transfer Deadline</div>
              <div style={styles.cdTitle}>GW4 Squad Lock</div>
            </div>
            <div style={styles.cdDate}>Saturday 15 March 2026 at 23:59</div>
          </div>
          <div style={styles.cdBlocks}>
            {[['d','Days'],['h','Hours'],['m','Mins'],['s','Secs']].map(([key, unit]) => (
              <div key={key} style={styles.cdBlock}>
                <span style={styles.cdNum}>{countdown[key]}</span>
                <span style={styles.cdUnit}>{unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prize split */}
        <div style={styles.sectionTag}>Points and Rankings</div>
        <div style={styles.prizeRow}>
          <div style={{ ...styles.prizeCard, borderColor: 'rgba(255,215,0,.35)' }}>
            <div style={styles.prizePlace}>1st Place</div>
            <div style={{ ...styles.prizePct, color: '#FFD700' }}>50%</div>
            <div style={styles.prizeAmt}>approx. N78,000</div>
          </div>
          <div style={{ ...styles.prizeCard, borderColor: 'rgba(176,190,197,.25)' }}>
            <div style={styles.prizePlace}>2nd Place</div>
            <div style={{ ...styles.prizePct, color: '#B0BEC5' }}>30%</div>
            <div style={styles.prizeAmt}>approx. N46,800</div>
          </div>
          <div style={{ ...styles.prizeCard, borderColor: 'rgba(201,112,56,.25)' }}>
            <div style={styles.prizePlace}>3rd Place</div>
            <div style={{ ...styles.prizePct, color: '#C97038' }}>20%</div>
            <div style={styles.prizeAmt}>approx. N31,200</div>
          </div>
        </div>

        {/* Leaderboard */}
        <div style={styles.leaderboard}>
          <div style={styles.lbHead}>
            <div>#</div><div>Manager</div><div style={{textAlign:'right'}}>Pts</div><div style={{textAlign:'right'}}>Prize</div>
          </div>
          {leaderboard.map(row => (
            <div key={row.rank} style={{ ...styles.lbRow, ...(row.you ? styles.lbYou : {}) }}>
              <div style={{ ...styles.rank, color: row.rank===1?'#FFD700':row.rank===2?'#B0BEC5':row.rank===3?'#C97038':'#5A7A5E' }}>
                {row.rank}
              </div>
              <div style={styles.lbUser}>
                <div style={styles.lbAv}>{row.name.slice(0,2).toUpperCase()}</div>
                <div>
                  <div style={styles.lbName}>
                    {row.name}
                    {row.you && <span style={styles.youBadge}>YOU</span>}
                  </div>
                  <div style={styles.lbTeam}>{row.team}</div>
                </div>
              </div>
              <div style={{ ...styles.lbPts, color: row.you ? '#00E676' : '#5A7A5E' }}>{row.pts.toLocaleString()}</div>
              <div style={{ ...styles.lbPrize, color: row.rank===1?'#FFD700':row.rank===2?'#B0BEC5':row.rank===3?'#C97038':'#5A7A5E' }}>
                {row.prize || '—'}
              </div>
            </div>
          ))}
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const styles = {
  wrap:{ minHeight:'100vh', background:'#080C0A', color:'#E8F5E9', fontFamily:'sans-serif' },
  loadWrap:{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#080C0A' },
  spinner:{ width:32, height:32, border:'3px solid #1E2E20', borderTop:'3px solid #00E676', borderRadius:'50%', animation:'spin .8s linear infinite' },

 

  // Content
  content:{ maxWidth:1000, margin:'0 auto', padding:'2rem 1.5rem' },

  // Welcome
  welcomeCard:{ background:'linear-gradient(135deg,rgba(0,230,118,.07),rgba(0,0,0,0))', border:'1px solid rgba(0,230,118,.2)', borderRadius:16, padding:'2rem', marginBottom:'1.5rem' },
  greeting:{ fontSize:'.72rem', fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'#5A7A5E' },
  username:{ fontSize:'2.5rem', fontWeight:900, color:'#E8F5E9', lineHeight:1.1, marginTop:4 },
  teamName:{ color:'#00E676', fontWeight:600, fontSize:'.92rem', marginTop:4 },

  // Stats
  statsGrid:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' },
  statCard:{ background:'#111A13', border:'1px solid #1E2E20', borderRadius:12, padding:'1.4rem 1.6rem' },
  statLabel:{ fontSize:'.65rem', fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'#5A7A5E', marginBottom:4 },
  statVal:{ fontSize:'2.5rem', fontWeight:900, lineHeight:1 },
  statSub:{ fontSize:'.75rem', color:'#5A7A5E', marginTop:4 },

  // Countdown
  cdCard:{ background:'#111A13', border:'1px solid #1E2E20', borderRadius:12, padding:'1.6rem', marginBottom:'1.8rem' },
  cdTop:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.2rem', flexWrap:'wrap', gap:'.5rem' },
  cdLabel:{ fontSize:'.65rem', fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'#5A7A5E', marginBottom:4 },
  cdTitle:{ fontWeight:800, fontSize:'1rem', color:'#E8F5E9' },
  cdDate:{ fontSize:'.78rem', color:'#5A7A5E' },
  cdBlocks:{ display:'flex', gap:'1rem', flexWrap:'wrap' },
  cdBlock:{ background:'#0D1410', border:'1px solid #1E2E20', borderRadius:10, padding:'.8rem 1rem', textAlign:'center', minWidth:65 },
  cdNum:{ display:'block', fontSize:'2.2rem', fontWeight:900, color:'#00E676', lineHeight:1 },
  cdUnit:{ fontSize:'.6rem', fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'#5A7A5E' },

  // Section tag
  sectionTag:{ fontSize:'.7rem', fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:'#00E676', marginBottom:'.8rem' },

  // Prize
  prizeRow:{ display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' },
  prizeCard:{ flex:1, minWidth:100, background:'#111A13', border:'1px solid #1E2E20', borderRadius:10, padding:'1.2rem', textAlign:'center' },
  prizePlace:{ fontSize:'.62rem', letterSpacing:2, textTransform:'uppercase', color:'#5A7A5E', marginBottom:4 },
  prizePct:{ fontSize:'2.2rem', fontWeight:900, lineHeight:1 },
  prizeAmt:{ fontSize:'.72rem', color:'#5A7A5E', marginTop:4 },

  // Leaderboard
  leaderboard:{ background:'#111A13', border:'1px solid #1E2E20', borderRadius:12, overflow:'hidden' },
  lbHead:{ display:'grid', gridTemplateColumns:'46px 1fr 80px 78px', padding:'.7rem 1.4rem', fontSize:'.63rem', fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'#5A7A5E', borderBottom:'1px solid #1E2E20' },
  lbRow:{ display:'grid', gridTemplateColumns:'46px 1fr 80px 78px', padding:'.85rem 1.4rem', borderBottom:'1px solid rgba(30,46,32,.5)', alignItems:'center' },
  lbYou:{ background:'rgba(0,230,118,.05)', borderLeft:'3px solid #00E676' },
  rank:{ fontSize:'1.2rem', fontWeight:900 },
  lbUser:{ display:'flex', alignItems:'center', gap:'.6rem' },
  lbAv:{ width:32, height:32, borderRadius:'50%', background:'#1E2E20', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'.68rem', color:'#00E676' },
  lbName:{ fontWeight:700, fontSize:'.85rem', color:'#E8F5E9' },
  lbTeam:{ fontSize:'.7rem', color:'#5A7A5E' },
  lbPts:{ fontSize:'1.4rem', fontWeight:900, textAlign:'right' },
  lbPrize:{ textAlign:'right', fontSize:'.75rem', fontWeight:700 },
  youBadge:{ fontSize:'.6rem', color:'#00E676', background:'rgba(0,230,118,.1)', padding:'.08rem .35rem', borderRadius:3, marginLeft:6 },
}