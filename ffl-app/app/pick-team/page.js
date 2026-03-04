'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const FORMATIONS = {
  '4-3-3': { def:4, mid:3, fwd:3 },
  '4-4-2': { def:4, mid:4, fwd:2 },
  '3-5-2': { def:3, mid:5, fwd:2 },
  '5-3-2': { def:5, mid:3, fwd:2 },
  '4-5-1': { def:4, mid:5, fwd:1 },
  '3-4-3': { def:3, mid:4, fwd:3 },
}

const BENCH_SLOTS = [
  { id:'b1', pos:'gk',  role:'GK' },
  { id:'b2', pos:'def', role:'CB' },
  { id:'b3', pos:'mid', role:'CM' },
  { id:'b4', pos:'fwd', role:'ST' },
]

const GW_POINTS = {
  'Musa':8,'Abubakar':6,'Fashola':3,'Ibrahim':7,'Chukwu':5,
  'Eze':9,'Nwosu':4,'Adeyemi':6,'Okafor':2,'Salami':3,
  'Balogun':8,'Yusuf':2,'Olawale':1,'Dike':3,'Lawal':0,
}

const posMap = { GK:'gk', DEF:'def', MID:'mid', FWD:'fwd' }

function buildPitchSquad(savedSquad, formation) {
  if (!savedSquad || savedSquad.length === 0) return null
  const { def, mid, fwd } = FORMATIONS[formation]
  const grouped = { gk:[], def:[], mid:[], fwd:[] }
  savedSquad.forEach(p => {
    const key = posMap[p.pos] || p.pos.toLowerCase()
    if (grouped[key]) grouped[key].push(p)
  })
  const fieldSlots = [
    ...Array(fwd).fill(null).map((_,i) => ({ id:`f${i+1}`, pos:'fwd', role:i===0?'ST':i===1?'ST':'WG' })),
    ...Array(mid).fill(null).map((_,i) => ({ id:`m${i+1}`, pos:'mid', role:i===0?'CM':i===1?'CM':i===2?'AM':'CM' })),
    ...Array(def).fill(null).map((_,i) => ({ id:`d${i+1}`, pos:'def', role:def===3?'CB':i===0?'LB':i===def-1?'RB':'CB' })),
    { id:'g1', pos:'gk', role:'GK' },
  ]
  const field = fieldSlots.map(slot => {
    const pool = grouped[slot.pos] || []
    const player = pool.shift()
    return { ...slot, name: player?.name || '—', pts: player ? (GW_POINTS[player.name] ?? 0) : 0 }
  })
  const bench = BENCH_SLOTS.map(slot => {
    const pool = grouped[slot.pos] || []
    const player = pool.shift()
    return { ...slot, name: player?.name || '—', pts: player ? (GW_POINTS[player.name] ?? 0) : 0 }
  })
  return { field, bench }
}

function getFallback(formation) {
  const { def, mid, fwd } = FORMATIONS[formation]
  const allPlayers = [
    {name:'Musa',pos:'fwd'},{name:'Abubakar',pos:'fwd'},{name:'Fashola',pos:'fwd'},
    {name:'Ibrahim',pos:'mid'},{name:'Chukwu',pos:'mid'},{name:'Eze',pos:'mid'},
    {name:'Nwosu',pos:'def'},{name:'Adeyemi',pos:'def'},{name:'Okafor',pos:'def'},{name:'Salami',pos:'def'},
    {name:'Balogun',pos:'gk'},
  ]
  const grouped = { gk:[], def:[], mid:[], fwd:[] }
  allPlayers.forEach(p => { if(grouped[p.pos]) grouped[p.pos].push(p) })
  const fieldSlots = [
    ...Array(fwd).fill(null).map((_,i) => ({ id:`f${i+1}`, pos:'fwd', role:i===0?'ST':i===1?'ST':'WG' })),
    ...Array(mid).fill(null).map((_,i) => ({ id:`m${i+1}`, pos:'mid', role:i===0?'CM':i===1?'CM':i===2?'AM':'CM' })),
    ...Array(def).fill(null).map((_,i) => ({ id:`d${i+1}`, pos:'def', role:def===3?'CB':i===0?'LB':i===def-1?'RB':'CB' })),
    { id:'g1', pos:'gk', role:'GK' },
  ]
  const field = fieldSlots.map(slot => {
    const pool = grouped[slot.pos] || []
    const player = pool.shift()
    return { ...slot, name: player?.name || '—', pts: player ? (GW_POINTS[player.name] ?? 0) : 0 }
  })
  const bench = [
    {id:'b1',pos:'gk', role:'GK',name:'Yusuf',  pts:GW_POINTS['Yusuf']  ??0},
    {id:'b2',pos:'def',role:'CB',name:'Olawale', pts:GW_POINTS['Olawale']??0},
    {id:'b3',pos:'mid',role:'CM',name:'Dike',    pts:GW_POINTS['Dike']   ??0},
    {id:'b4',pos:'fwd',role:'ST',name:'Lawal',   pts:GW_POINTS['Lawal']  ??0},
  ]
  return { field, bench }
}

// Calculate effective points with captain/vc multipliers
function effectivePts(name, pts, captain, viceCaptain) {
  if (name === captain)     return Math.round(pts * 2)
  if (name === viceCaptain) return Math.round(pts * 1.5)
  return pts
}

export default function PickTeam() {
  const router = useRouter()
  const [formation, setFormation]         = useState('4-3-3')
  const [squad, setSquad]                 = useState(null)
  const [rawSquad, setRawSquad]           = useState(null)
  const [selected, setSelected]           = useState(null)
  const [hint, setHint]                   = useState('Tap a player to select, then tap another to substitute')
  const [hintActive, setHintActive]       = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [loading, setLoading]             = useState(true)
  const [showFormPicker, setShowFormPicker] = useState(false)
  const [captain, setCaptain]             = useState(null)
  const [viceCaptain, setViceCaptain]     = useState(null)
  const [armband, setArmband]             = useState(null) // 'captain' | 'vice' | null — pending assignment
  const [showArmband, setShowArmband]     = useState(false)
  const [armbandPlayer, setArmbandPlayer] = useState(null)

  useEffect(() => {
    async function load() {
      const { data:{ session } } = await supabase.auth.getSession()
      if (!session) { router.push('/signin'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('squad, formation, captain, vice_captain')
        .eq('id', session.user.id)
        .single()
      const savedFormation = profile?.formation || '4-3-3'
      setFormation(savedFormation)
      if (profile?.captain)      setCaptain(profile.captain)
      if (profile?.vice_captain) setViceCaptain(profile.vice_captain)
      if (profile?.squad && profile.squad.length > 0) {
        setRawSquad(profile.squad)
        setSquad(buildPitchSquad(profile.squad, savedFormation) || getFallback(savedFormation))
      } else {
        setSquad(getFallback(savedFormation))
      }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!formation) return
    setSquad(rawSquad
      ? (buildPitchSquad(rawSquad, formation) || getFallback(formation))
      : getFallback(formation))
    setSelected(null)
    setHint('Tap a player to select, then tap another to substitute')
    setHintActive(false)
  }, [formation])

  const handleFormationChange = (f) => { setFormation(f); setShowFormPicker(false) }

  const posColor = pos => pos==='gk'?'#FFD700':pos==='def'?'#00E676':pos==='mid'?'#64B5F6':'#EF9A9A'
  const posBg    = pos => pos==='gk'?'rgba(255,215,0,.07)':pos==='def'?'rgba(0,230,118,.07)':pos==='mid'?'rgba(100,181,246,.07)':'rgba(239,154,154,.07)'

  // Long press / right click opens armband menu
  const handlePlayerClick = (player, zone) => {
    if (player.name === '—') return

    // If armband menu is open — assign and close
    if (showArmband && armbandPlayer?.id === player.id) {
      setShowArmband(false); setArmbandPlayer(null); return
    }

    // Normal substitution logic
    if (!selected) {
      setSelected({ player, zone })
      setHint(`${player.name} selected — tap another to sub, or hold to set captain`)
      setHintActive(true)
    } else {
      if (selected.player.id === player.id) {
        setSelected(null)
        setHint('Tap a player to select, then tap another to substitute')
        setHintActive(false)
        return
      }
      const zoneOk = (selected.zone==='field' && zone==='bench') || (selected.zone==='bench' && zone==='field')
      const posOk  = selected.player.pos==='gk' ? player.pos==='gk' : player.pos!=='gk'
      if (zoneOk && posOk) {
        setSquad(prev => {
          const nf = [...prev.field], nb = [...prev.bench]
          const fi=nf.findIndex(p=>p.id===selected.player.id)
          const bi=nb.findIndex(p=>p.id===selected.player.id)
          const tfi=nf.findIndex(p=>p.id===player.id)
          const tbi=nb.findIndex(p=>p.id===player.id)
          if(fi>-1&&tbi>-1){ const t={name:nf[fi].name,pts:nf[fi].pts}; nf[fi]={...nf[fi],name:nb[tbi].name,pts:nb[tbi].pts}; nb[tbi]={...nb[tbi],...t} }
          else if(bi>-1&&tfi>-1){ const t={name:nb[bi].name,pts:nb[bi].pts}; nb[bi]={...nb[bi],name:nf[tfi].name,pts:nf[tfi].pts}; nf[tfi]={...nf[tfi],...t} }
          return { field:nf, bench:nb }
        })
        setHint('Substitution made')
        setTimeout(() => { setHint('Tap a player to select, then tap another to substitute'); setHintActive(false) }, 2000)
      } else {
        setHint('Invalid swap — check positions')
        setTimeout(() => { setHint('Tap a player to select, then tap another to substitute'); setHintActive(false) }, 2000)
      }
      setSelected(null)
    }
  }

  const handleLongPress = (player) => {
    if (player.name === '—') return
    setArmbandPlayer(player)
    setShowArmband(true)
    setSelected(null)
    setHint(`Assign armband to ${player.name}`)
    setHintActive(true)
  }

  const assignCaptain = (name) => {
    if (viceCaptain === name) setViceCaptain(null)
    setCaptain(name)
    setShowArmband(false); setArmbandPlayer(null)
    setHint(`${name} is now Captain — 2x points every GW`)
    setHintActive(true)
    setTimeout(() => { setHint('Tap a player to select, then tap another to substitute'); setHintActive(false) }, 3000)
  }

  const assignVice = (name) => {
    if (captain === name) setCaptain(null)
    setViceCaptain(name)
    setShowArmband(false); setArmbandPlayer(null)
    setHint(`${name} is now Vice Captain — 1.5x points every GW`)
    setHintActive(true)
    setTimeout(() => { setHint('Tap a player to select, then tap another to substitute'); setHintActive(false) }, 3000)
  }

  const handleSave = async () => {
    const { data:{ session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('profiles').update({ formation, captain, vice_captain: viceCaptain }).eq('id', session.user.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#080C0A' }}>
      <div style={{ width:32, height:32, border:'3px solid #1E2E20', borderTop:'3px solid #00E676', borderRadius:'50%', animation:'spin .8s linear infinite' }}></div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!squad) return null

  const fwds = squad.field.filter(p => p.pos==='fwd')
  const mids = squad.field.filter(p => p.pos==='mid')
  const defs = squad.field.filter(p => p.pos==='def')
  const gks  = squad.field.filter(p => p.pos==='gk')

  const allFieldPlayers = [...squad.field].filter(p => p.name !== '—')
  const totalPts = allFieldPlayers.reduce((s,p) => s + effectivePts(p.name, p.pts||0, captain, viceCaptain), 0)

  return (
    <div style={styles.wrap} onClick={() => { if(showArmband){ setShowArmband(false); setArmbandPlayer(null) } }}>
      <div style={styles.content}>
        <div style={styles.sectionTag}>Pick Team</div>
        <div style={styles.title}>Your Starting XI + Bench</div>

        {/* Armband legend */}
        <div style={styles.armbandLegend}>
          <div style={styles.alItem}>
            <div style={styles.cBadge}>C</div>
            <span>{captain || 'No captain set'}</span>
            {captain && <span style={styles.alMult}>x2 pts</span>}
          </div>
          <div style={styles.alItem}>
            <div style={styles.vcBadge}>V</div>
            <span>{viceCaptain || 'No vice captain set'}</span>
            {viceCaptain && <span style={styles.alMult}>x1.5 pts</span>}
          </div>
          <div style={styles.alHint}>Hold any player to assign armband</div>
        </div>

        {/* Top bar */}
        <div style={styles.topBar}>
          <div style={styles.chips}>
            <div style={{ position:'relative' }}>
              <button style={styles.formChip} onClick={e => { e.stopPropagation(); setShowFormPicker(p=>!p) }}>
                Formation <span style={styles.chipVal}>{formation}</span>
                <span style={{ marginLeft:6, color:'#5A7A5E', fontSize:'.7rem' }}>▾</span>
              </button>
              {showFormPicker && (
                <div style={styles.formDropdown}>
                  {Object.keys(FORMATIONS).map(f => (
                    <button key={f} style={{ ...styles.formOption, ...(formation===f?styles.formOptionActive:{}) }} onClick={() => handleFormationChange(f)}>
                      {f}{formation===f && <span style={{ color:'#00E676', marginLeft:6 }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={styles.chip}>GW Points <span style={styles.chipVal}>{totalPts}</span></div>
          </div>
          <div style={{ display:'flex', gap:'.6rem', alignItems:'center' }}>
            <a href="/transfers" style={styles.transfersLink}>Transfers</a>
            <button style={{ ...styles.saveBtn, ...(saved?styles.saveBtnDone:{}) }} onClick={handleSave}>
              {saved ? 'Saved' : 'Save Team'}
            </button>
          </div>
        </div>

        <div style={{ ...styles.hint, ...(hintActive?styles.hintActive:{}) }}>{hint}</div>

        {/* Armband picker popup */}
        {showArmband && armbandPlayer && (
          <div style={styles.armbandPopup} onClick={e => e.stopPropagation()}>
            <div style={styles.armbandPopupTitle}>Assign armband to <strong style={{ color:'#E8F5E9' }}>{armbandPlayer.name}</strong></div>
            <div style={styles.armbandPopupBtns}>
              <button
                style={{ ...styles.armbandBtn, ...(captain===armbandPlayer.name ? styles.armbandBtnActive : {}) }}
                onClick={() => assignCaptain(armbandPlayer.name)}
              >
                <div style={styles.cBadge}>C</div>
                Captain <span style={styles.multLabel}>2x pts</span>
              </button>
              <button
                style={{ ...styles.armbandBtn, ...(viceCaptain===armbandPlayer.name ? styles.armbandBtnVcActive : {}) }}
                onClick={() => assignVice(armbandPlayer.name)}
              >
                <div style={styles.vcBadge}>V</div>
                Vice Captain <span style={styles.multLabel}>1.5x pts</span>
              </button>
            </div>
          </div>
        )}

        {/* Pitch */}
        <div style={styles.pitch}>
          <div style={styles.fieldLabel}>Attack</div>
          <PlayerRow players={fwds} selected={selected} onSelect={handlePlayerClick} onLong={handleLongPress} captain={captain} viceCaptain={viceCaptain} posColor={posColor} posBg={posBg} zone="field" effectivePts={effectivePts} />
          <PlayerRow players={mids} selected={selected} onSelect={handlePlayerClick} onLong={handleLongPress} captain={captain} viceCaptain={viceCaptain} posColor={posColor} posBg={posBg} zone="field" effectivePts={effectivePts} />
          <div style={{ ...styles.fieldLabel, opacity:.3 }}>Midfield</div>
          <PlayerRow players={defs} selected={selected} onSelect={handlePlayerClick} onLong={handleLongPress} captain={captain} viceCaptain={viceCaptain} posColor={posColor} posBg={posBg} zone="field" effectivePts={effectivePts} />
          <div style={{ ...styles.fieldLabel, opacity:.3 }}>Defence</div>
          <PlayerRow players={gks}  selected={selected} onSelect={handlePlayerClick} onLong={handleLongPress} captain={captain} viceCaptain={viceCaptain} posColor={posColor} posBg={posBg} zone="field" effectivePts={effectivePts} />
          <div style={styles.fieldLabel}>Goal</div>
        </div>

        {/* Bench */}
        <div style={styles.bench}>
          <div style={styles.benchLabel}>Bench — tap to substitute</div>
          <div style={styles.benchRow}>
            {squad.bench.map(p => (
              <PlayerToken
                key={p.id}
                player={p}
                isSelected={selected?.player.id === p.id}
                onSelect={() => handlePlayerClick(p,'bench')}
                onLong={() => handleLongPress(p)}
                captain={captain}
                viceCaptain={viceCaptain}
                posColor={posColor}
                posBg={posBg}
                benchPos={p.pos.toUpperCase()}
                effectivePts={effectivePts}
              />
            ))}
          </div>
        </div>

        <div style={styles.armbandInfo}>
          Captain scores <strong style={{ color:'#FFD700' }}>2x</strong> points every gameweek.
          Vice Captain scores <strong style={{ color:'#00E676' }}>1.5x</strong> points every gameweek.
          Hold any player to assign or change armband.
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function PlayerRow({ players, selected, onSelect, onLong, captain, viceCaptain, posColor, posBg, zone, effectivePts }) {
  return (
    <div style={{ display:'flex', justifyContent:'center', gap:'clamp(.4rem,2vw,1.8rem)', margin:'.5rem 0' }}>
      {players.map(p => (
        <PlayerToken
          key={p.id} player={p}
          isSelected={selected?.player.id === p.id}
          onSelect={() => onSelect(p, zone)}
          onLong={() => onLong(p)}
          captain={captain} viceCaptain={viceCaptain}
          posColor={posColor} posBg={posBg}
          effectivePts={effectivePts}
        />
      ))}
    </div>
  )
}

function PlayerToken({ player, isSelected, onSelect, onLong, captain, viceCaptain, posColor, posBg, benchPos, effectivePts }) {
  const color   = posColor(player.pos)
  const bg      = posBg(player.pos)
  const empty   = player.name === '—'
  const isCap   = player.name === captain
  const isVice  = player.name === viceCaptain
  const ePts    = effectivePts(player.name, player.pts||0, captain, viceCaptain)

  // Long press support
  let pressTimer = null
  const onMouseDown = () => { pressTimer = setTimeout(() => onLong(player), 600) }
  const onMouseUp   = () => { clearTimeout(pressTimer) }
  const onTouchStart = () => { pressTimer = setTimeout(() => onLong(player), 600) }
  const onTouchEnd   = () => { clearTimeout(pressTimer) }

  return (
    <div
      style={{ display:'flex', flexDirection:'column', alignItems:'center', cursor:empty?'default':'pointer', userSelect:'none', opacity:empty?.4:1 }}
      onClick={onSelect}
      onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    >
      <div style={{ position:'relative' }}>
        {benchPos && <div style={styles.benchBadge}>{benchPos}</div>}
        <div style={{
          width:48, height:48, borderRadius:'50%', background:bg,
          border:`2px solid ${isSelected?'#FFD700':color}`,
          boxShadow: isSelected?`0 0 0 3px #FFD700,0 0 18px rgba(255,215,0,.4)`:isCap?`0 0 0 2px #FFD700,0 0 12px rgba(255,215,0,.3)`:isVice?`0 0 0 2px #00E676,0 0 10px rgba(0,230,118,.25)`:'none',
          display:'flex', alignItems:'center', justifyContent:'center',
          color, fontWeight:900, fontSize:'.82rem', transition:'box-shadow .2s', position:'relative'
        }}>
          {player.role}
          {isCap  && <div style={styles.cBadgePlayer}>C</div>}
          {isVice && <div style={styles.vcBadgePlayer}>V</div>}
        </div>
      </div>
      <div style={{ marginTop:4, fontSize:'.56rem', fontWeight:700, textTransform:'uppercase', color:isSelected?'#FFD700':isCap?'#FFD700':isVice?'#00E676':'#E8F5E9', maxWidth:58, textAlign:'center', lineHeight:1.2 }}>
        {player.name}
      </div>
      <div style={{ fontSize:'.75rem', fontWeight:900, color: ePts>=6?'#00E676':ePts>=3?'#FFD700':'#5A7A5E' }}>
        {ePts} pts{isCap?' (C)':isVice?' (V)':''}
      </div>
    </div>
  )
}

const styles = {
  wrap:{ minHeight:'100vh', background:'#080C0A', color:'#E8F5E9', fontFamily:'sans-serif' },
  content:{ maxWidth:900, margin:'0 auto', padding:'2rem 1.5rem' },
  sectionTag:{ fontSize:'.7rem', fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:'#00E676', marginBottom:'.5rem' },
  title:{ fontSize:'2rem', fontWeight:900, color:'#E8F5E9', marginBottom:'1rem' },

  // Armband legend
  armbandLegend:{ display:'flex', alignItems:'center', gap:'1.2rem', background:'#111A13', border:'1px solid #1E2E20', borderRadius:10, padding:'.75rem 1.2rem', marginBottom:'1rem', flexWrap:'wrap' },
  alItem:{ display:'flex', alignItems:'center', gap:'.5rem', fontSize:'.8rem', fontWeight:700, color:'#E8F5E9' },
  alMult:{ fontSize:'.68rem', color:'#5A7A5E', marginLeft:2 },
  alHint:{ marginLeft:'auto', fontSize:'.68rem', color:'#5A7A5E' },

  // Armband badges
  cBadge:{ width:20, height:20, background:'#FFD700', color:'#080C0A', borderRadius:'50%', fontSize:'.65rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  vcBadge:{ width:20, height:20, background:'rgba(0,230,118,.2)', border:'1px solid #00E676', color:'#00E676', borderRadius:'50%', fontSize:'.65rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  cBadgePlayer:{ position:'absolute', top:-3, right:-3, width:14, height:14, background:'#FFD700', color:'#080C0A', borderRadius:'50%', fontSize:'.45rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' },
  vcBadgePlayer:{ position:'absolute', top:-3, right:-3, width:14, height:14, background:'#0D1410', border:'1px solid #00E676', color:'#00E676', borderRadius:'50%', fontSize:'.45rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' },

  // Armband popup
  armbandPopup:{ background:'#111A13', border:'1px solid rgba(255,215,0,.3)', borderRadius:12, padding:'1.2rem', marginBottom:'1rem', boxShadow:'0 10px 40px rgba(0,0,0,.6)' },
  armbandPopupTitle:{ fontSize:'.82rem', color:'#5A7A5E', marginBottom:'1rem' },
  armbandPopupBtns:{ display:'flex', gap:'.8rem', flexWrap:'wrap' },
  armbandBtn:{ flex:1, display:'flex', alignItems:'center', gap:'.6rem', background:'#0D1410', border:'1px solid #1E2E20', borderRadius:8, padding:'.7rem 1rem', cursor:'pointer', fontSize:'.82rem', fontWeight:700, color:'#5A7A5E', fontFamily:'sans-serif', transition:'all .2s' },
  armbandBtnActive:{ background:'rgba(255,215,0,.08)', borderColor:'rgba(255,215,0,.4)', color:'#FFD700' },
  armbandBtnVcActive:{ background:'rgba(0,230,118,.08)', borderColor:'rgba(0,230,118,.3)', color:'#00E676' },
  multLabel:{ marginLeft:'auto', fontSize:'.72rem', color:'#5A7A5E' },

  topBar:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'.8rem' },
  chips:{ display:'flex', gap:'.6rem', flexWrap:'wrap', alignItems:'center' },
  chip:{ background:'#111A13', border:'1px solid #1E2E20', borderRadius:8, padding:'.4rem .8rem', fontSize:'.75rem', fontWeight:700, color:'#5A7A5E' },
  chipVal:{ color:'#00E676', fontWeight:900, marginLeft:4 },
  formChip:{ background:'#111A13', border:'1px solid #1E2E20', borderRadius:8, padding:'.4rem .8rem', fontSize:'.75rem', fontWeight:700, color:'#5A7A5E', cursor:'pointer', display:'flex', alignItems:'center', fontFamily:'sans-serif' },
  formDropdown:{ position:'absolute', top:'110%', left:0, background:'#111A13', border:'1px solid #1E2E20', borderRadius:10, overflow:'hidden', zIndex:50, minWidth:120, boxShadow:'0 10px 30px rgba(0,0,0,.5)' },
  formOption:{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'.6rem 1rem', background:'none', border:'none', color:'#5A7A5E', fontSize:'.82rem', fontWeight:700, cursor:'pointer', fontFamily:'sans-serif' },
  formOptionActive:{ background:'rgba(0,230,118,.08)', color:'#00E676' },
  saveBtn:{ background:'#00E676', color:'#080C0A', fontWeight:800, fontSize:'.82rem', padding:'.55rem 1.1rem', border:'none', borderRadius:6, cursor:'pointer' },
  saveBtnDone:{ background:'#0D1410', color:'#00E676', border:'1px solid #00E676' },
  transfersLink:{ color:'#5A7A5E', fontSize:'.8rem', fontWeight:700, textDecoration:'none', border:'1px solid #1E2E20', padding:'.5rem 1rem', borderRadius:6, background:'#111A13' },
  hint:{ fontSize:'.76rem', color:'#5A7A5E', background:'rgba(0,230,118,.05)', border:'1px solid rgba(0,230,118,.12)', padding:'.45rem 1rem', borderRadius:8, textAlign:'center', marginBottom:'.8rem' },
  hintActive:{ color:'#FFD700', background:'rgba(255,215,0,.06)', borderColor:'rgba(255,215,0,.25)' },
  pitch:{ background:'linear-gradient(180deg,#091409 0%,#0c2a0c 50%,#091409 100%)', border:'2px solid rgba(0,230,118,.12)', borderRadius:14, padding:'1.5rem 1rem' },
  fieldLabel:{ textAlign:'center', fontSize:'.55rem', fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:'rgba(255,255,255,.12)', margin:'.3rem 0' },
  bench:{ marginTop:'1.2rem', background:'rgba(0,0,0,.25)', border:'1px solid #1E2E20', borderRadius:10, padding:'.9rem 1rem' },
  benchLabel:{ fontSize:'.58rem', fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:'#5A7A5E', textAlign:'center', marginBottom:'.8rem' },
  benchRow:{ display:'flex', justifyContent:'center', gap:'clamp(.8rem,4vw,3rem)' },
  benchBadge:{ position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)', background:'#1E2E20', color:'#5A7A5E', fontSize:'.48rem', fontWeight:800, padding:'.08rem .3rem', borderRadius:3, whiteSpace:'nowrap', zIndex:1 },
  armbandInfo:{ marginTop:'1.2rem', textAlign:'center', fontSize:'.75rem', color:'#5A7A5E', lineHeight:1.8 },
}