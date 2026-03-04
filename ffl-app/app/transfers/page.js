'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const PLAYERS = [
  {id:'p1',  name:'Taiwo Abiodun',  team:'EMS FC',       pos:'GK',  price:4.5, form:7.2},
  {id:'p2',  name:'Kolade Festus',  team:'COLBIOS Utd',  pos:'GK',  price:5.0, form:6.8},
  {id:'p3',  name:'Hassan Umar',    team:'SAAT Rangers', pos:'GK',  price:5.5, form:7.5},
  {id:'p4',  name:'Segun Alabi',    team:'EMS FC',       pos:'DEF', price:6.0, form:7.0},
  {id:'p5',  name:'Tunde Badmos',   team:'COLBIOS Utd',  pos:'DEF', price:6.5, form:6.5},
  {id:'p6',  name:'David Onyeka',   team:'SAAT Rangers', pos:'DEF', price:7.0, form:7.8},
  {id:'p7',  name:'Paul Achike',    team:'EMS FC',       pos:'DEF', price:5.5, form:6.2},
  {id:'p8',  name:'Ridwan Afolabi', team:'COLANIM',      pos:'DEF', price:6.0, form:6.9},
  {id:'p9',  name:'Biodun Yusuf',   team:'COLANIM',      pos:'MID', price:8.0, form:8.1},
  {id:'p10', name:'Samuel Ogah',    team:'EMS FC',       pos:'MID', price:9.0, form:8.5},
  {id:'p11', name:'Kelechi Nnam',   team:'SAAT Rangers', pos:'MID', price:8.5, form:7.9},
  {id:'p12', name:'Adewale Ojo',    team:'COLBIOS Utd',  pos:'MID', price:7.5, form:7.3},
  {id:'p13', name:'Emeka Nwobi',    team:'COLANIM',      pos:'MID', price:9.5, form:8.8},
  {id:'p14', name:'Ayomide Bello',  team:'EMS FC',       pos:'FWD', price:10.0,form:8.6},
  {id:'p15', name:'Femi Akande',    team:'SAAT Rangers', pos:'FWD', price:11.0,form:9.1},
  {id:'p16', name:'Chidi Obi',      team:'COLBIOS Utd',  pos:'FWD', price:9.5, form:8.3},
  {id:'p17', name:'Niyi Fasanya',   team:'COLANIM',      pos:'FWD', price:8.0, form:7.7},
  {id:'p18', name:'Uche Osuji',     team:'EMS FC',       pos:'DEF', price:5.5, form:6.0},
]

const INITIAL_SQUAD = [
  {name:'Balogun',  pos:'GK',  price:5.5},
  {name:'Adeyemi',  pos:'DEF', price:7.0},
  {name:'Okafor',   pos:'DEF', price:6.5},
  {name:'Nwosu',    pos:'DEF', price:6.5},
  {name:'Salami',   pos:'DEF', price:6.0},
  {name:'Ibrahim',  pos:'MID', price:10.0},
  {name:'Chukwu',   pos:'MID', price:8.5},
  {name:'Eze',      pos:'MID', price:9.5},
  {name:'Musa',     pos:'FWD', price:12.5},
  {name:'Abubakar', pos:'FWD', price:9.0},
  {name:'Fashola',  pos:'FWD', price:8.5},
]

const BUDGET       = 100
const FREE_TRANSFERS = 1

export default function Transfers() {
  const router = useRouter()
  const [squad, setSquad]           = useState([])
  const [search, setSearch]         = useState('')
  const [posFilter, setPosFilter]   = useState('ALL')
  const [transfers, setTransfers]   = useState(0)
  const [pointsHit, setPointsHit]   = useState(0)
  const [toast, setToast]           = useState({ show:false, msg:'', bad:false })
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    async function load() {
      const { data:{ session } } = await supabase.auth.getSession()
      if (!session) { router.push('/signin'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('squad, transfers_made, points_hit')
        .eq('id', session.user.id)
        .single()

      if (profile?.squad && profile.squad.length > 0) {
        setSquad(profile.squad)
      } else {
        setSquad(INITIAL_SQUAD)
      }

      if (profile?.transfers_made) setTransfers(profile.transfers_made)
      if (profile?.points_hit)     setPointsHit(profile.points_hit)

      setLoading(false)
    }
    load()
  }, [])

  // Live budget calculations
  const spent      = squad.reduce((sum, p) => sum + (p.price || 0), 0)
  const budgetLeft = Math.max(0, BUDGET - spent).toFixed(1)
  const extraTransfers = Math.max(0, transfers - FREE_TRANSFERS)
  const pointsCost     = extraTransfers * 4

  const showToast = (msg, bad=false) => {
    setToast({ show:true, msg, bad })
    setTimeout(() => setToast({ show:false, msg:'', bad:false }), 2500)
  }

  const handleSaveTeam = async () => {
    setSaving(true)
    const { data:{ session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase
      .from('profiles')
      .update({
        squad: squad,
        transfers_made: transfers,
        points_hit: pointsCost,
      })
      .eq('id', session.user.id)

    setSaving(false)

    if (error) {
      showToast('Failed to save team', true)
    } else {
      showToast('Team saved successfully')
    }
  }

  const teamCount = (teamName) => squad.filter(p => {
    const match = PLAYERS.find(x => x.name === p.name)
    return match?.team === teamName
  }).length

  const addPlayer = (player) => {
    if (squad.length >= 15)               { showToast('Squad full — 15/15', true); return }
    if (squad.find(p => p.name === player.name)) { showToast('Player already in squad', true); return }
    if (teamCount(player.team) >= 3)      { showToast(`Max 3 players from ${player.team}`, true); return }
    if (spent + player.price > BUDGET)    { showToast('Not enough budget', true); return }

    setSquad(prev => [...prev, { name: player.name, pos: player.pos, price: player.price }])
    setTransfers(t => {
      const newT = t + 1
      const extra = Math.max(0, newT - FREE_TRANSFERS)
      setPointsHit(extra * 4)
      return newT
    })
    showToast(`${player.name} added — N${player.price}M`)
  }

  const removePlayer = (name) => {
    setSquad(prev => prev.filter(p => p.name !== name))
  }

  const filtered = PLAYERS.filter(p => {
    const posOk      = posFilter === 'ALL' || p.pos === posFilter
    const searchOk   = p.name.toLowerCase().includes(search.toLowerCase()) ||
                       p.team.toLowerCase().includes(search.toLowerCase())
    const notInSquad = !squad.find(s => s.name === p.name)
    return posOk && searchOk && notInSquad
  })

  const posTagStyle = (pos) => {
    if (pos==='GK')  return { background:'rgba(255,215,0,.1)',   color:'#FFD700' }
    if (pos==='DEF') return { background:'rgba(0,230,118,.1)',   color:'#00E676' }
    if (pos==='MID') return { background:'rgba(100,181,246,.1)', color:'#64B5F6' }
    return                  { background:'rgba(239,154,154,.1)', color:'#EF9A9A' }
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#080C0A' }}>
      <div style={{ width:32, height:32, border:'3px solid #1E2E20', borderTop:'3px solid #00E676', borderRadius:'50%', animation:'spin .8s linear infinite' }}></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={styles.wrap}>
      <div style={styles.content}>
        <div style={styles.sectionTag}>Transfers</div>
        <div style={styles.title}>Manage Your Squad</div>

        {/* Deadline bar */}
        <div style={styles.deadlineBar}>
          <div>
            <div style={styles.deadlineLabel}>GW4 Transfer Deadline</div>
            <div style={styles.deadlineDate}>Saturday, 15 March 2026 at 23:59</div>
          </div>
          <div style={styles.deadlineBadges}>
            <div style={styles.badge}>
              Free Transfers
              <span style={styles.badgeVal}>{FREE_TRANSFERS}</span>
            </div>
            <div style={styles.badge}>
              Transfers Made
              <span style={styles.badgeVal}>{transfers}</span>
            </div>
            <div style={styles.badge}>
              Extra Transfers
              <span style={styles.badgeVal}>{extraTransfers}</span>
            </div>
            <div style={{ ...styles.badge, borderColor: pointsCost > 0 ? 'rgba(239,154,154,.3)' : '#1E2E20' }}>
              Points Cost
              <span style={{ ...styles.badgeVal, color: pointsCost > 0 ? '#EF9A9A' : '#5A7A5E' }}>
                {pointsCost > 0 ? `-${pointsCost} pts` : '0 pts'}
              </span>
            </div>
          </div>
        </div>

        {/* Points warning */}
        {pointsCost > 0 && (
          <div style={styles.pointsWarning}>
            You have {extraTransfers} extra transfer{extraTransfers > 1 ? 's' : ''} this gameweek.
            <strong style={{ color:'#EF9A9A' }}> -{pointsCost} points</strong> will be deducted from your GW4 score.
          </div>
        )}

        {/* Save bar */}
        <div style={styles.saveBar}>
          <div style={styles.budgetSummary}>
            <div style={styles.budgetPill}>
              <span style={styles.budgetPillLabel}>Budget</span>
              <span style={styles.budgetPillVal}>N{BUDGET}M</span>
            </div>
            <div style={styles.budgetPill}>
              <span style={styles.budgetPillLabel}>Spent</span>
              <span style={{ ...styles.budgetPillVal, color:'#00E676' }}>N{spent.toFixed(1)}M</span>
            </div>
            <div style={styles.budgetPill}>
              <span style={styles.budgetPillLabel}>Left</span>
              <span style={{ ...styles.budgetPillVal, color: parseFloat(budgetLeft) < 5 ? '#EF9A9A' : '#FFD700' }}>
                N{budgetLeft}M
              </span>
            </div>
            <div style={styles.budgetPill}>
              <span style={styles.budgetPillLabel}>Squad</span>
              <span style={{ ...styles.budgetPillVal, color: squad.length === 15 ? '#00E676' : '#E8F5E9' }}>
                {squad.length}/15
              </span>
            </div>
          </div>
          <button
            style={{ ...styles.saveTeamBtn, ...(saving ? styles.saveTeamBtnLoading : {}) }}
            onClick={handleSaveTeam}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Team'}
          </button>
        </div>

        <div style={styles.layout}>
          {/* LEFT */}
          <div>
            <div style={styles.rulesPanel}>
              <div style={styles.rulesTitle}>Transfer Rules</div>
              {[
                ['1 free transfer per gameweek.', 'Each extra costs -4 points.'],
                ['Max 3 players from the same team', 'in your squad at any time.'],
                ['Stay within your N100M budget.', 'Selling prices may change.'],
                ['Squad must be 15 players:', '2 GK · 5 DEF · 5 MID · 3 FWD'],
                ['Transfers after the deadline', 'apply to the next gameweek only.'],
              ].map(([a, b], i) => (
                <div key={i} style={styles.ruleItem}>
                  <div style={styles.ruleDot}></div>
                  <div style={styles.ruleText}><strong>{a}</strong> {b}</div>
                </div>
              ))}
            </div>

            <div style={styles.squadPanel}>
              <div style={styles.squadHeader}>
                <div style={styles.squadTitle}>My Squad</div>
                <div style={styles.squadCount}>
                  <span style={{ color:'#00E676' }}>{squad.length}</span>
                  <span style={{ color:'#5A7A5E' }}>/15</span>
                </div>
              </div>
              <div style={styles.slots}>
                {squad.map(p => (
                  <div key={p.name} style={styles.slot}>
                    <span style={{ ...styles.posTag, ...posTagStyle(p.pos) }}>{p.pos}</span>
                    <span style={styles.slotName}>{p.name}</span>
                    <span style={styles.slotPrice}>N{p.price}M</span>
                    <button style={styles.removeBtn} onClick={() => removePlayer(p.name)}>x</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={styles.poolPanel}>
            <div style={styles.poolHeader}>
              <input
                style={styles.searchInput}
                placeholder="Search players or teams..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div style={styles.posTabs}>
                {['ALL','GK','DEF','MID','FWD'].map(p => (
                  <button
                    key={p}
                    style={{ ...styles.posTab, ...(posFilter===p ? styles.posTabActive : {}) }}
                    onClick={() => setPosFilter(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.playerList}>
              {filtered.length === 0 && (
                <div style={styles.emptyState}>No players found</div>
              )}
              {filtered.map(p => (
                <div key={p.id} style={styles.poolItem}>
                  <div style={{ width:24, height:24, borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.55rem', fontWeight:800, flexShrink:0, ...posTagStyle(p.pos) }}>
                    {p.pos}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={styles.playerName}>{p.name}</div>
                    <div style={styles.playerTeam}>{p.team}</div>
                  </div>
                  <div style={styles.playerForm}>{p.form} pts</div>
                  <div style={styles.playerPrice}>N{p.price}M</div>
                  <button
                    style={{ ...styles.addBtn, ...(spent + p.price > BUDGET ? styles.addBtnDisabled : {}) }}
                    onClick={() => addPlayer(p)}
                    disabled={spent + p.price > BUDGET}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toast.show && (
        <div style={{ ...styles.toast, ...(toast.bad ? styles.toastBad : {}) }}>
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const styles = {
  wrap:{ minHeight:'100vh', background:'#080C0A', color:'#E8F5E9', fontFamily:'sans-serif' },
  content:{ maxWidth:1100, margin:'0 auto', padding:'2rem 1.5rem' },
  sectionTag:{ fontSize:'.7rem', fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:'#00E676', marginBottom:'.5rem' },
  title:{ fontSize:'2rem', fontWeight:900, color:'#E8F5E9', marginBottom:'1rem' },

  deadlineBar:{ background:'linear-gradient(135deg,rgba(255,215,0,.07),transparent)', border:'1px solid rgba(255,215,0,.2)', borderRadius:10, padding:'.9rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'.6rem' },
  deadlineLabel:{ fontSize:'.63rem', fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'#5A7A5E' },
  deadlineDate:{ fontSize:'1.3rem', fontWeight:900, color:'#FFD700' },
  deadlineBadges:{ display:'flex', gap:'.8rem', flexWrap:'wrap' },
  badge:{ background:'#111A13', border:'1px solid #1E2E20', borderRadius:8, padding:'.45rem .9rem', fontSize:'.75rem', fontWeight:700, display:'flex', flexDirection:'column', alignItems:'center', color:'#5A7A5E' },
  badgeVal:{ fontSize:'1.2rem', fontWeight:900, color:'#00E676', marginTop:2 },

  pointsWarning:{ background:'rgba(239,154,154,.07)', border:'1px solid rgba(239,154,154,.25)', borderRadius:8, padding:'.75rem 1.2rem', fontSize:'.8rem', color:'#5A7A5E', marginBottom:'1rem', lineHeight:1.5 },

  saveBar:{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#111A13', border:'1px solid #1E2E20', borderRadius:10, padding:'.9rem 1.5rem', marginBottom:'1.4rem', flexWrap:'wrap', gap:'1rem' },
  budgetSummary:{ display:'flex', gap:'.8rem', flexWrap:'wrap' },
  budgetPill:{ display:'flex', flexDirection:'column', alignItems:'center', background:'#0D1410', border:'1px solid #1E2E20', borderRadius:8, padding:'.4rem .8rem', minWidth:60 },
  budgetPillLabel:{ fontSize:'.58rem', fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#5A7A5E' },
  budgetPillVal:{ fontSize:'1.1rem', fontWeight:900, color:'#E8F5E9', marginTop:2 },
  saveTeamBtn:{ background:'#00E676', color:'#080C0A', fontWeight:800, fontSize:'.88rem', padding:'.6rem 1.6rem', border:'none', borderRadius:8, cursor:'pointer', whiteSpace:'nowrap' },
  saveTeamBtnLoading:{ background:'#0D1410', color:'#00E676', border:'1px solid #00E676', cursor:'not-allowed' },

  layout:{ display:'grid', gridTemplateColumns:'270px 1fr', gap:'1.4rem' },
  rulesPanel:{ background:'#111A13', border:'1px solid #1E2E20', borderRadius:12, padding:'1.4rem', marginBottom:'1.2rem' },
  rulesTitle:{ fontWeight:800, fontSize:'.82rem', letterSpacing:1, textTransform:'uppercase', color:'#E8F5E9', marginBottom:'.9rem' },
  ruleItem:{ display:'flex', gap:'.65rem', alignItems:'flex-start', marginBottom:'.8rem', paddingBottom:'.8rem', borderBottom:'1px solid #1E2E20' },
  ruleDot:{ width:6, height:6, borderRadius:'50%', background:'#00E676', flexShrink:0, marginTop:5 },
  ruleText:{ fontSize:'.78rem', lineHeight:1.5, color:'#5A7A5E' },

  squadPanel:{ background:'#111A13', border:'1px solid #1E2E20', borderRadius:12, overflow:'hidden' },
  squadHeader:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.8rem 1.4rem', borderBottom:'1px solid #1E2E20' },
  squadTitle:{ fontWeight:800, fontSize:'.82rem', textTransform:'uppercase', letterSpacing:1, color:'#E8F5E9' },
  squadCount:{ fontSize:'1.35rem', fontWeight:900 },
  slots:{ display:'flex', flexWrap:'wrap', gap:'.45rem', padding:'.9rem 1.4rem' },
  slot:{ background:'#0D1410', border:'1px solid #1E2E20', borderRadius:7, padding:'.35rem .75rem', fontSize:'.7rem', display:'flex', alignItems:'center', gap:'.35rem' },
  posTag:{ fontSize:'.52rem', fontWeight:800, letterSpacing:.5, textTransform:'uppercase', borderRadius:3, padding:'.08rem .28rem' },
  slotName:{ color:'#E8F5E9', fontWeight:600, flex:1 },
  slotPrice:{ color:'#5A7A5E', fontSize:'.65rem' },
  removeBtn:{ background:'none', border:'none', color:'#5A7A5E', cursor:'pointer', fontSize:'.75rem', padding:0, marginLeft:2 },

  poolPanel:{ background:'#111A13', border:'1px solid #1E2E20', borderRadius:12, overflow:'hidden' },
  poolHeader:{ padding:'.9rem 1.4rem', borderBottom:'1px solid #1E2E20' },
  searchInput:{ width:'100%', background:'#0D1410', border:'1px solid #1E2E20', borderRadius:7, padding:'.55rem .9rem', color:'#E8F5E9', fontFamily:'sans-serif', fontSize:'.82rem', outline:'none', boxSizing:'border-box' },
  posTabs:{ display:'flex', gap:'.35rem', marginTop:'.7rem', flexWrap:'wrap' },
  posTab:{ background:'transparent', border:'1px solid #1E2E20', borderRadius:5, padding:'.25rem .6rem', fontSize:'.7rem', fontWeight:700, letterSpacing:1, color:'#5A7A5E', cursor:'pointer', fontFamily:'sans-serif' },
  posTabActive:{ background:'rgba(0,230,118,.09)', borderColor:'#00E676', color:'#00E676' },
  playerList:{ maxHeight:460, overflowY:'auto' },
  emptyState:{ padding:'2rem', textAlign:'center', color:'#5A7A5E', fontSize:'.85rem' },
  poolItem:{ display:'grid', gridTemplateColumns:'28px 1fr 55px 58px 34px', gap:'.5rem', alignItems:'center', padding:'.7rem 1.4rem', borderBottom:'1px solid rgba(30,46,32,.4)' },
  playerName:{ fontWeight:700, fontSize:'.8rem', color:'#E8F5E9' },
  playerTeam:{ fontSize:'.65rem', color:'#5A7A5E' },
  playerForm:{ fontSize:'.68rem', color:'#5A7A5E', textAlign:'center' },
  playerPrice:{ fontSize:'1rem', fontWeight:900, color:'#FFD700', textAlign:'right' },
  addBtn:{ width:24, height:24, borderRadius:'50%', border:'1px solid #00E676', background:'transparent', color:'#00E676', fontSize:'.95rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  addBtnDisabled:{ borderColor:'#1E2E20', color:'#1E2E20', cursor:'not-allowed' },

  toast:{ position:'fixed', bottom:'2rem', left:'50%', transform:'translateX(-50%)', background:'#FFD700', color:'#080C0A', padding:'.55rem 1.4rem', borderRadius:100, fontWeight:800, fontSize:'.82rem', zIndex:1000 },
  toastBad:{ background:'#EF9A9A', color:'#080C0A' },
}