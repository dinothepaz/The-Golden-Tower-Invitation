import { db } from './firebase/config'
import { collection, addDoc } from 'firebase/firestore'
import guestData from './guestlist.json'

console.log('IMPORT FILE RUNNING')
console.log(guestData)

const importGuests = async () => {
  try {
    for (const guest of guestData) {
      console.log('ADDING:', guest)

      await addDoc(collection(db, 'guestlist'), {
        name: guest.name,
        seats: guest.seats
      })
    }

    console.log('Guests imported successfully!')
  } catch (error) {
    console.error(error)
  }
}

importGuests()