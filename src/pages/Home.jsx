import { useState, useRef, useEffect } from 'react'
import { db } from '../firebase/config'

import {
  collection,
  onSnapshot,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore'

const GOLD       = '#F4D675'
const GOLD_DEEP  = '#C9A84C'
const GOLD_LIGHT = '#FFE7A0'
const INK        = '#2D1F4A'
const VIOLET     = '#3D2A6B'


function normalize(str) {
  return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
function getSuggestions(input, guestNames) {
  if (!input || input.length < 2) return []
  const q = normalize(input)
  return guestNames.filter(name => normalize(name).includes(q)).slice(0, 6)
}
function getExactMatch(input, guestNames) {
  const q = normalize(input)
  return guestNames.find(name => normalize(name) === q) || null
}

function Sparkle({ size = 14, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <path d="M12 2L13.2 9.8L20 8L14.2 13L17 20L12 15.5L7 20L9.8 13L4 8L10.8 9.8L12 2Z" fill={GOLD}/>
    </svg>
  )
}

function StarDivider() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
      <div style={{ height:'1px', width:60, background:`linear-gradient(to right, transparent, ${GOLD_DEEP})` }}/>
      <Sparkle size={10}/>
      <svg width="5" height="5" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill={GOLD}/></svg>
      <Sparkle size={10}/>
      <div style={{ height:'1px', width:60, background:`linear-gradient(to left, transparent, ${GOLD_DEEP})` }}/>
    </div>
  )
}

export default function Invite() {
  const [guests, setGuests] = useState({})
  const [showRsvp, setShowRsvp]       = useState(false)
  const [step, setStep]               = useState(1)
  const [name, setName]               = useState('')
  const [attending, setAttending]     = useState('yes')
  const [message, setMessage]         = useState('')
  const [companions, setCompanions]   = useState([])
  const [submitted, setSubmitted]     = useState(false)
  const [saving, setSaving]           = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [nameError, setNameError]     = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef   = useRef(null)
  const suggestRef = useRef(null)

  const guestNames         = Object.keys(guests)
  const matchedGuest       = getExactMatch(name, guestNames)
  const seats              = matchedGuest ? guests[matchedGuest] : 0
  const companionCount     = seats - 1
  const needsCompanionStep = attending === 'yes' && companionCount > 0

  useEffect(() => {
    function handleClick(e) {
      if (suggestRef.current && !suggestRef.current.contains(e.target) && e.target !== inputRef.current)
        setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
  const unsub = onSnapshot(collection(db, 'guestlist'), (snapshot) => {
    const guestData = {}

    snapshot.forEach((doc) => {
      guestData[doc.data().name] = doc.data().seats
    })

    setGuests(guestData)
  })

  return () => unsub()
}, [])

  function handleNameChange(val) {
    setName(val); setNameError('')
    const s = getSuggestions(val, guestNames)
    setSuggestions(s); setShowSuggestions(s.length > 0)
  }
  function selectSuggestion(n) {
    setName(n); setSuggestions([]); setShowSuggestions(false); setNameError('')
  }
  function handleProceed() {
    if (!name.trim()) { setNameError('Please enter your name.'); return }
    if (!matchedGuest) { setNameError('Name not found on the guest list. Please check your full name.'); return }
    if (needsCompanionStep) { setCompanions(Array(companionCount).fill('')); setStep(2) }
    else submitRsvp([])
  }

async function submitRsvp(companionList) {
  setSaving(true)

  try {
    // CHECK IF NAME ALREADY RSVP'D
    const q = query(
      collection(db, 'rsvps'),
      where('name', '==', matchedGuest)
    )

    const existing = await getDocs(q)

    if (!existing.empty) {
      alert('This guest has already submitted an RSVP.')
      setSaving(false)
      return
    }

    // SAVE RSVP
    await addDoc(collection(db, 'rsvps'), {
      name: matchedGuest,
      attending,
      message: message.trim(),
      companions: companionList,
      seats,
      createdAt: new Date()
    })

    setSubmitted(true)

  } catch (err) {
    console.error(err)
    alert(err.message)
  }

  setSaving(false)
}
  function handleConfirmCompanions() {
    submitRsvp(companions.map(c => c.trim()).filter(Boolean))
  }
  function openRsvp() {
    setShowRsvp(true); setStep(1); setName(''); setAttending('yes')
    setMessage(''); setCompanions([]); setSubmitted(false); setNameError('')
  }

  return (
    <div style={{ margin:0, padding:0, minHeight:'100vh', fontFamily:"'Cormorant Garamond',Georgia,serif", color:INK, position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=IM+Fell+English:ital@0;1&display=swap');

        @keyframes fadeUp      { from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);} }
        @keyframes slowZoom    { from{transform:scale(1);}to{transform:scale(1.07);} }
        @keyframes twinkle     { 0%,100%{opacity:0.1;transform:scale(0.7);}50%{opacity:1;transform:scale(1.3);} }
        @keyframes float       { 0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);} }
        @keyframes shimmer     { 0%{background-position:200% center;}100%{background-position:-200% center;} }
        @keyframes glowPulse   { 0%,100%{box-shadow:0 8px 40px rgba(61,42,107,0.1),0 0 0 1px rgba(244,214,117,0.25),inset 0 1px 0 rgba(255,255,255,0.9);}50%{box-shadow:0 8px 60px rgba(61,42,107,0.15),0 0 0 1px rgba(244,214,117,0.55),0 0 40px rgba(244,214,117,0.1),inset 0 1px 0 rgba(255,255,255,1);} }
        @keyframes titleGlow   { 0%,100%{text-shadow:0 0 20px rgba(244,214,117,0.5),0 2px 8px rgba(61,42,107,0.2);}50%{text-shadow:0 0 50px rgba(244,214,117,0.9),0 0 100px rgba(244,214,117,0.35),0 2px 8px rgba(61,42,107,0.2);} }
        @keyframes borderPulse { 0%,100%{border-color:rgba(244,214,117,0.4);}50%{border-color:rgba(244,214,117,1);} }

        *{box-sizing:border-box;margin:0;padding:0;}

        .hero-text-1{animation:fadeUp 1.2s 0.2s ease both;}
        .hero-text-2{animation:fadeUp 1.2s 0.5s ease both;}
        .hero-text-3{animation:fadeUp 1.2s 0.8s ease both;}
        .hero-btn   {animation:fadeUp 1.2s 1.1s ease both;}
        .hero-img   {animation:slowZoom 18s ease-in-out infinite alternate;}
        .sparkle-dot{animation:twinkle var(--d,3s) var(--del,0s) ease-in-out infinite;}
        .float-el   {animation:float 6s ease-in-out infinite;}

        .gold-title {
          font-family:'IM Fell English',Georgia,serif;
          font-style:italic;
          font-weight:400;
          color:${GOLD_DEEP};
          animation:titleGlow 4s ease-in-out infinite;
        }

        .glass-panel {
          background:rgba(255,255,255,0.75);
          backdrop-filter:blur(24px);
          -webkit-backdrop-filter:blur(24px);
          border:1px solid rgba(244,214,117,0.35);
          border-radius:28px;
          animation:glowPulse 5s ease-in-out infinite;
        }

        .label-tag {
          display:block;
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:10px;
          letter-spacing:3.5px;
          text-transform:uppercase;
          color:${VIOLET};
          font-weight:600;
          margin-bottom:8px;
        }

        .rsvp-input {
          width:100%;
          padding:13px 18px;
          background:rgba(255,255,255,0.65);
          border:1px solid rgba(201,168,76,0.35);
          border-radius:14px;
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:16px;
          color:${INK};
          outline:none;
          transition:all 0.3s ease;
          backdrop-filter:blur(8px);
        }
        .rsvp-input:focus {
          border-color:rgba(244,214,117,0.9);
          background:rgba(255,255,255,0.9);
          box-shadow:0 0 0 3px rgba(244,214,117,0.18),0 0 20px rgba(244,214,117,0.12);
        }
        .rsvp-input::placeholder{color:rgba(61,42,107,0.3);}

        .att-btn {
          flex:1;
          padding:13px 16px;
          background:rgba(255,255,255,0.5);
          border:1px solid rgba(201,168,76,0.35);
          border-radius:14px;
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:11px;
          letter-spacing:2px;
          text-transform:uppercase;
          color:${VIOLET};
          cursor:pointer;
          transition:all 0.3s ease;
          backdrop-filter:blur(8px);
        }
        .att-btn:hover {
          background:rgba(244,214,117,0.12);
          border-color:rgba(244,214,117,0.7);
          color:${INK};
        }
        .att-btn.active {
          background:rgba(244,214,117,0.18);
          border-color:${GOLD_DEEP};
          color:${INK};
          font-weight:600;
          box-shadow:0 0 20px rgba(244,214,117,0.2),inset 0 1px 0 rgba(255,255,255,0.9);
          animation:borderPulse 3s ease-in-out infinite;
        }

        .submit-btn {
          width:100%;
          padding:15px;
          background:rgba(255,255,255,0.45);
          border:1px solid rgba(201,168,76,0.55);
          border-radius:16px;
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:12px;
          letter-spacing:5px;
          text-transform:uppercase;
          color:${INK};
          cursor:pointer;
          transition:all 0.35s ease;
          backdrop-filter:blur(8px);
          position:relative;
          overflow:hidden;
        }
        .submit-btn::before {
          content:'';
          position:absolute;inset:0;
          background:linear-gradient(90deg,transparent,rgba(244,214,117,0.18),transparent);
          background-size:200% 100%;
          animation:shimmer 2.5s linear infinite;
          pointer-events:none;
        }
        .submit-btn:hover:not(:disabled) {
          background:rgba(244,214,117,0.2);
          border-color:${GOLD_DEEP};
          box-shadow:0 0 30px rgba(244,214,117,0.3),0 4px 20px rgba(61,42,107,0.1);
          transform:translateY(-2px);
        }
        .submit-btn:disabled{opacity:0.3;cursor:not-allowed;}

        .close-link {
          width:100%;
          margin-top:14px;
          background:none;
          border:none;
          color:${VIOLET};
          cursor:pointer;
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:11px;
          letter-spacing:3px;
          text-transform:uppercase;
          opacity:0.5;
          transition:opacity 0.25s;
        }
        .close-link:hover{opacity:1;}

        .suggest-list {
          position:absolute;top:100%;left:0;right:0;z-index:50;
          background:rgba(255,255,255,0.95);
          border:1px solid rgba(244,214,117,0.35);
          border-top:none;
          border-radius:0 0 14px 14px;
          backdrop-filter:blur(20px);
          box-shadow:0 12px 32px rgba(61,42,107,0.12);
          overflow:hidden;
        }
        .suggest-item {
          padding:12px 18px;
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:15px;
          color:${INK};
          cursor:pointer;
          transition:background 0.18s;
          display:flex;align-items:center;gap:10px;
        }
        .suggest-item:hover{background:rgba(244,214,117,0.12);color:${VIOLET};}

        .name-error {
          font-size:12px;
          color:#7B3060;
          letter-spacing:0.3px;
          margin-top:7px;
          font-family:'Cormorant Garamond',Georgia,serif;
          font-style:italic;
        }

        .rsvp-overlay {
          position:fixed;inset:0;
          background:rgba(45,31,74,0.4);
          backdrop-filter:blur(14px);
          -webkit-backdrop-filter:blur(14px);
          z-index:100;
          display:flex;align-items:center;justify-content:center;
          padding:24px;
          animation:fadeUp 0.35s ease;
          overflow-y:auto;
        }

        .modal-corner{position:absolute;pointer-events:none;}

        @media(max-width:480px){
          .modal-glass{padding:36px 24px !important;}
        }
      `}</style>

      {/* ── Background gradient ── */}
      <div style={{
        position:'fixed', inset:0, zIndex:0,
        background:'radial-gradient(ellipse at 25% 15%, #EDE6FF 0%, #F5F0FF 40%, #EDE5FF 70%, #E5DCFF 100%)',
      }}/>

      {/* ── Soft glow orbs ── */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'-15%', left:'-10%', width:700, height:700, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(244,214,117,0.13) 0%, transparent 65%)' }}/>
        <div style={{ position:'absolute', bottom:'-20%', right:'-15%', width:800, height:800, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(120,70,200,0.09) 0%, transparent 65%)' }}/>
        <div style={{ position:'absolute', top:'35%', right:'15%', width:450, height:450, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(244,214,117,0.07) 0%, transparent 65%)' }}/>
      </div>

      {/* ── Sparkle field ── */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        {[...Array(55)].map((_,i) => {
          const size  = Math.random() * 3 + 1
          const delay = (Math.random() * 5).toFixed(2)
          const dur   = (Math.random() * 3 + 2).toFixed(2)
          const isStar = Math.random() > 0.55
          return isStar ? (
            <div key={i} className="sparkle-dot" style={{
              position:'absolute',
              left:`${Math.random()*100}%`,
              top:`${Math.random()*100}%`,
              '--d':`${dur}s`, '--del':`${delay}s`,
            }}>
              <svg width={size*3+3} height={size*3+3} viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.2 9.8L20 8L14.2 13L17 20L12 15.5L7 20L9.8 13L4 8L10.8 9.8L12 2Z" fill={GOLD} opacity="0.65"/>
              </svg>
            </div>
          ) : (
            <div key={i} className="sparkle-dot" style={{
              position:'absolute',
              left:`${Math.random()*100}%`,
              top:`${Math.random()*100}%`,
              width:size, height:size,
              borderRadius:'50%',
              background:GOLD,
              opacity:0.5,
              '--d':`${dur}s`, '--del':`${delay}s`,
            }}/>
          )
        })}
      </div>

      {/* ── Hero ── */}
      <div style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
        <div className="hero-img" style={{ position:'absolute', inset:0, backgroundImage:'url(/elice.jpg)', backgroundSize:'cover', backgroundPosition:'center top', opacity:0.18 }}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(237,230,255,0.2) 0%, rgba(245,240,255,0.05) 50%, rgba(232,223,255,0.4) 100%)' }}/>

        <div style={{ position:'relative', zIndex:2, textAlign:'center', padding:'80px 32px', maxWidth:560 }}>

          {/* Eyebrow */}
          <div className="hero-text-1" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:30 }}>
            <div style={{ height:'1px', width:44, background:`linear-gradient(to right, transparent, ${GOLD_DEEP})` }}/>
            <p style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:10, letterSpacing:6, textTransform:'uppercase', color:VIOLET, margin:0, fontWeight:600 }}>
              You are cordially invited
            </p>
            <div style={{ height:'1px', width:44, background:`linear-gradient(to left, transparent, ${GOLD_DEEP})` }}/>
          </div>

          {/* Main titles */}
          <h1 className="hero-text-2 gold-title" style={{ fontSize:'clamp(46px,9vw,74px)', lineHeight:1.05, margin:'0 0 6px', letterSpacing:1 }}>
            Elice's Decade
          </h1>
          <h1 className="hero-text-2 gold-title" style={{ fontSize:'clamp(46px,9vw,74px)', lineHeight:1.1, margin:'0 0 38px', letterSpacing:1 }}>
            and Eight
          </h1>

          {/* Divider + numeral */}
          <div className="hero-text-3" style={{ marginBottom:56 }}>
            <StarDivider/>
            <p style={{ margin:'18px 0 0', fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:12, letterSpacing:6, textTransform:'uppercase', color:GOLD_DEEP, fontWeight:600 }}>XVIII</p>
          </div>

          {/* RSVP button */}
          <div className="hero-btn float-el">
            <button
              onClick={openRsvp}
              className="submit-btn"
              style={{ width:'auto', padding:'17px 68px', fontSize:11, letterSpacing:7, display:'inline-block' }}
            >
              ✦ &nbsp;RSVP&nbsp; ✦
            </button>
          </div>
        </div>
      </div>

      {/* ── RSVP Modal ── */}
      {showRsvp && (
        <div className="rsvp-overlay" onClick={e => e.target === e.currentTarget && setShowRsvp(false)}>
          <div
            className="glass-panel modal-glass"
            style={{ maxWidth:448, width:'100%', padding:'54px 46px', position:'relative' }}
          >
            {/* Corner ornaments */}
            {[
              { top:14, left:14 },
              { top:14, right:14, transform:'scaleX(-1)' },
              { bottom:14, right:14, transform:'scale(-1,-1)' },
              { bottom:14, left:14, transform:'scaleY(-1)' },
            ].map((pos, i) => (
              <div key={i} className="modal-corner" style={{ width:32, height:32, ...pos }}>
                <svg viewBox="0 0 32 32" fill="none" width="32" height="32">
                  <path d="M2 2 L18 2" stroke={GOLD_DEEP} strokeWidth="1"/>
                  <path d="M2 2 L2 18" stroke={GOLD_DEEP} strokeWidth="1"/>
                  <circle cx="2" cy="2" r="2.5" fill={GOLD}/>
                  <circle cx="7" cy="7" r="1.2" fill={GOLD_DEEP} opacity="0.35"/>
                </svg>
              </div>
            ))}

            {/* STEP 1 */}
            {!submitted && step === 1 && (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <Sparkle size={12}/>
                  <p style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontStyle:'italic', fontSize:11, letterSpacing:4, textTransform:'uppercase', color:VIOLET, margin:0, fontWeight:600 }}>Your Response</p>
                </div>
                <h2 style={{ fontFamily:"'IM Fell English',Georgia,serif", fontStyle:'italic', fontWeight:400, fontSize:34, color:INK, margin:'0 0 32px', lineHeight:1.2, textShadow:`0 0 24px rgba(244,214,117,0.18)` }}>
                  Will you join us?
                </h2>

                <div style={{ marginBottom:22 }}>
                  <label className="label-tag">Your Name</label>
                  <div style={{ position:'relative' }}>
                    <input
                      ref={inputRef}
                      className="rsvp-input"
                      type="text"
                      placeholder="Start typing your name..."
                      value={name}
                      onChange={e => handleNameChange(e.target.value)}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                      autoComplete="off"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="suggest-list" ref={suggestRef}>
                        {suggestions.map(s => (
                          <div key={s} className="suggest-item" onMouseDown={() => selectSuggestion(s)}>
                            <Sparkle size={9}/>{s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {nameError && <p className="name-error">{nameError}</p>}
                  {matchedGuest && (
                    <p style={{ fontSize:13, color:VIOLET, marginTop:8, fontFamily:"'Cormorant Garamond',Georgia,serif", fontStyle:'italic', display:'flex', alignItems:'center', gap:6, fontWeight:600 }}>
                      <Sparkle size={10}/> {seats} seat{seats > 1 ? 's' : ''} reserved for you
                    </p>
                  )}
                </div>

                <div style={{ marginBottom:22 }}>
                  <label className="label-tag">Attendance</label>
                  <div style={{ display:'flex', gap:10 }}>
                    {[{ v:'yes', l:'Joyfully accepts' },{ v:'no', l:'Unable to attend' }].map(o => (
                      <button key={o.v} className={`att-btn${attending===o.v?' active':''}`} onClick={() => setAttending(o.v)}>{o.l}</button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom:36 }}>
                  <label className="label-tag">A Message for Elice <span style={{ opacity:0.4, fontWeight:400 }}>(optional)</span></label>
                  <textarea
                    className="rsvp-input"
                    placeholder="Write something lovely..."
                    rows={3}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    style={{ resize:'none' }}
                  />
                </div>

                <button className="submit-btn" onClick={handleProceed} disabled={!name.trim()}>
                  ✦ &nbsp;Proceed&nbsp; ✦
                </button>
                <button className="close-link" onClick={() => setShowRsvp(false)}>Close</button>
              </>
            )}

            {/* STEP 2 */}
            {!submitted && step === 2 && (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <Sparkle size={12}/>
                  <p style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontStyle:'italic', fontSize:11, letterSpacing:4, textTransform:'uppercase', color:VIOLET, margin:0, fontWeight:600 }}>Almost there</p>
                </div>
                <h2 style={{ fontFamily:"'IM Fell English',Georgia,serif", fontStyle:'italic', fontWeight:400, fontSize:28, color:INK, margin:'0 0 12px', lineHeight:1.3 }}>
                  There {seats===2?'is':'are'} <span style={{ color:GOLD_DEEP }}>{seats}</span> seats allotted for you!
                </h2>
                <p style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:15, color:VIOLET, margin:'0 0 28px', lineHeight:1.75, fontWeight:400 }}>
                  Please indicate {companionCount} more {companionCount===1?'name':'names'} that will accompany you on the event.
                </p>

                <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:36 }}>
                  {companions.map((c,i) => (
                    <div key={i}>
                      <label className="label-tag" style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <Sparkle size={9}/> Guest {i+1}
                      </label>
                      <input
                        className="rsvp-input"
                        type="text"
                        placeholder="Full name"
                        value={c}
                        onChange={e => { const u=[...companions]; u[i]=e.target.value; setCompanions(u) }}
                      />
                    </div>
                  ))}
                </div>

                <button className="submit-btn" onClick={handleConfirmCompanions} disabled={saving}>
                  {saving ? '✦ Sending... ✦' : '✦ Confirm ✦'}
                </button>
                <button className="close-link" onClick={() => setStep(1)}>Go Back</button>
              </>
            )}

            {/* SUBMITTED */}
            {submitted && (
              <div style={{ textAlign:'center', padding:'12px 0' }}>
                <div style={{ marginBottom:32 }}><StarDivider/></div>
                <div className="float-el" style={{ marginBottom:22 }}>
                  <Sparkle size={44}/>
                </div>
                <h2 style={{ fontFamily:"'IM Fell English',Georgia,serif", fontStyle:'italic', fontWeight:400, fontSize:34, color:INK, margin:'0 0 14px', textShadow:`0 0 24px rgba(244,214,117,0.25)` }}>
                  {attending==='yes' ? 'See you there' : 'You will be missed'}
                </h2>
                <p style={{ fontSize:14, color:VIOLET, letterSpacing:1, margin:'0 0 32px', fontFamily:"'Cormorant Garamond',Georgia,serif", fontStyle:'italic', fontWeight:400 }}>
                  Thank you, {matchedGuest}.
                </p>
                <div style={{ marginBottom:36 }}><StarDivider/></div>
                <button
                  onClick={() => setShowRsvp(false)}
                  style={{ background:'none', border:'none', color:VIOLET, cursor:'pointer', fontSize:11, letterSpacing:5, textTransform:'uppercase', fontFamily:"'Cormorant Garamond',Georgia,serif", opacity:0.6, transition:'opacity 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity=1}
                  onMouseLeave={e => e.currentTarget.style.opacity=0.6}
                >
                  ✦ Close ✦
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}