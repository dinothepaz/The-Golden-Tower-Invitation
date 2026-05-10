import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'

import { db } from '../firebase/config'


export default function AdminLogin() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [password, setPassword] = useState('')

  const [guestList, setGuestList] = useState([])
  const [rsvps, setRsvps] = useState([])

  const [guestName, setGuestName] = useState('')
  const [guestSeats, setGuestSeats] = useState(1)

  // LOGIN
  function handleLogin(e) {
    e.preventDefault()

    if (password === 'pazword123') {
      setLoggedIn(true)
    } else {
      alert('Wrong password')
    }
  }

const [authorized, setAuthorized] = useState(false)

useEffect(() => {
  const unsub = onAuthStateChanged(auth, (user) => {
    if (user) {
      setAuthorized(true)
    } else {
      window.location.href = '/admin'
    }
  })

  return () => unsub()
}, [])



  // LOAD GUEST LIST
  useEffect(() => {
    if (!loggedIn) return

    const unsub = onSnapshot(collection(db, 'guestlist'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setGuestList(data)
    })

    return () => unsub()
  }, [loggedIn])

  // LOAD RSVPS
  useEffect(() => {
    if (!loggedIn) return

    const unsub = onSnapshot(collection(db, 'rsvps'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setRsvps(data)
    })

    return () => unsub()
  }, [loggedIn])

  // ADD GUEST
  async function addGuest(e) {
    e.preventDefault()

    if (!guestName.trim()) return

    await addDoc(collection(db, 'guestlist'), {
      name: guestName,
      seats: Number(guestSeats)
    })

    setGuestName('')
    setGuestSeats(1)
  }

  // DELETE GUEST
  async function removeGuest(id) {
    await deleteDoc(doc(db, 'guestlist', id))
  }

  async function deleteRSVP(id) {
  const confirmDelete = confirm(
    'Delete this RSVP response?'
  )

  if (!confirmDelete) return

  await deleteDoc(doc(db, 'rsvps', id))
}

  // LOGIN PAGE
  if (!loggedIn) {
    if (!authorized) return null
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginBox}>
          <h1 style={styles.loginTitle}>ADMIN PANEL</h1>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />

            <button style={styles.button}>
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>RSVP ADMIN</h1>
          <p style={styles.subtitle}>
            Manage guests and live RSVP responses
          </p>
        </div>

        <div style={styles.stats}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Guests</span>
            <span style={styles.statValue}>{guestList.length}</span>
          </div>

          <div style={styles.statCard}>
            <span style={styles.statLabel}>Responses</span>
            <span style={styles.statValue}>{rsvps.length}</span>
          </div>
        </div>
      </div>

      {/* PANELS */}
      <div style={styles.grid}>
        {/* GUEST PANEL */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Guest List</h2>
          </div>

          <form onSubmit={addGuest} style={styles.addForm}>
            <input
              type="text"
              placeholder="Guest name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              style={styles.input}
            />

            <input
              type="number"
              min="1"
              value={guestSeats}
              onChange={(e) => setGuestSeats(e.target.value)}
              style={styles.input}
            />

            <button style={styles.button}>
              Add
            </button>
          </form>

          <div style={styles.list}>
            {guestList.map((guest) => (
              <div key={guest.id} style={styles.listItem}>
                <div>
                  <div style={styles.guestName}>
                    {guest.name}
                  </div>

                  <div style={styles.guestSeats}>
                    {guest.seats} seat(s)
                  </div>
                </div>

                <button
                  onClick={() => removeGuest(guest.id)}
                  style={styles.deleteBtn}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RSVP PANEL */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>RSVP Responses</h2>
          </div>

          <div style={styles.list}>
            {rsvps.map((rsvp) => (
              <div key={rsvp.id} style={styles.rsvpCard}>
                <div style={styles.rsvpTop}>
  <h3 style={styles.rsvpName}>
    {rsvp.name}
  </h3>

  <div style={{
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  }}>
    <span style={{
      ...styles.badge,
      background:
        rsvp.attending === 'yes'
          ? '#18361F'
          : '#3B1E1E'
    }}>
      {rsvp.attending}
    </span>

    <button 
      onClick={() => deleteRSVP(rsvp.id)}
      style={styles.deleteBtn}
    >
      Delete
    </button>
  </div>
</div>

                {rsvp.message && (
                  <p style={styles.message}>
                    "{rsvp.message}"
                  </p>
                )}

                {rsvp.companions?.length > 0 && (
                  <div style={styles.companions}>
                    <strong>Companions:</strong>

                    <ul>
                      {rsvp.companions.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {rsvps.length === 0 && (
              <p style={styles.empty}>
                No responses yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0E0E0E',
    color: 'white',
    padding: '40px',
    fontFamily: 'Inter, sans-serif'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px'
  },

  title: {
    fontSize: '40px',
    fontWeight: '700',
    margin: 0
  },

  subtitle: {
    opacity: 0.6,
    marginTop: '8px'
  },

  stats: {
    display: 'flex',
    gap: '16px'
  },

  statCard: {
    border: '1px solid #222',
    background: '#151515',
    padding: '20px',
    minWidth: '120px'
  },

  statLabel: {
    display: 'block',
    opacity: 0.5,
    marginBottom: '10px'
  },

  statValue: {
    fontSize: '32px',
    fontWeight: '700'
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px'
  },

  panel: {
    background: '#151515',
    border: '1px solid #222',
    padding: '24px',
    height: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },

  panelHeader: {
    marginBottom: '20px'
  },

  panelTitle: {
    margin: 0,
    fontSize: '22px'
  },

  addForm: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },

  input: {
    background: '#0E0E0E',
    border: '1px solid #333',
    color: 'white',
    padding: '14px',
    outline: 'none',
    flex: 1
  },

  button: {
    background: 'white',
    color: 'black',
    border: 'none',
    padding: '14px 20px',
    cursor: 'pointer',
    fontWeight: '600'
  },

  list: {
    overflowY: 'auto',
    flex: 1
  },

  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #222'
  },

  guestName: {
    fontWeight: '600'
  },

  guestSeats: {
    opacity: 0.5,
    marginTop: '4px'
  },

  deleteBtn: {
    background: 'transparent',
    border: '1px solid #444',
    color: '#999',
    padding: '10px 14px',
    cursor: 'pointer'
  },

  rsvpCard: {
    borderBottom: '1px solid #222',
    padding: '18px 0'
  },

  rsvpTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  rsvpName: {
    margin: 0
  },

  badge: {
    padding: '6px 10px',
    fontSize: '12px',
    textTransform: 'uppercase'
  },

  message: {
    opacity: 0.7,
    lineHeight: 1.6
  },

  companions: {
    marginTop: '10px',
    opacity: 0.8
  },

  empty: {
    opacity: 0.5
  },

  loginPage: {
    minHeight: '100vh',
    background: '#0E0E0E',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  loginBox: {
    width: '350px',
    background: '#151515',
    border: '1px solid #222',
    padding: '40px'
  },

  loginTitle: {
    marginTop: 0,
    marginBottom: '24px',
    fontSize: '28px'
  }
}