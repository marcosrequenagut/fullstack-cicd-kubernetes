import { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { es }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales,
})

interface Court {
  id: number
  name: string
}

interface Reservation {
  id: number
  court_id: number
  player_id: number
  date_of_reservation: string
  start_time: string
  end_time: string
}

function isCourtAvailable(courtId: number, slotStart: Date, slotEnd: Date, reservations: any[]) {
  return !reservations.some((r) => {
    if (r.court_id !== courtId) return false
    return r.start < slotEnd && r.end > slotStart
  })
}

function generateStartTimes(selectedDate: Date) {
  const times = []
  let current = new Date(selectedDate)
  current.setHours(9, 0, 0, 0)

  const closingTime = new Date(selectedDate)
  closingTime.setHours(22, 0, 0, 0)

  while (current.getTime() + 60 * 60 * 1000 <= closingTime.getTime()) {
    times.push(new Date(current))
    current = new Date(current.getTime() + 90 * 60 * 1000)
  }

  return times
}

function PadelBooking() {
  const [events, setEvents] = useState<any[]>([])
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [courts, setCourts] = useState<Court[]>([])
  const [selectedStart, setSelectedStart] = useState<Date | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)

  useEffect(() => {
    fetch('/api/courts')
      .then((response) => response.json())
      .then((data) => setCourts(data))
  }, [])

  const loadReservations = () => {
    fetch('/api/reservations')
      .then((response) => response.json())
      .then((data: Reservation[]) => {
        const mapped = data.map((r) => ({
          title: `Court ${r.court_id}`,
          court_id: r.court_id,
          start: new Date(`${r.date_of_reservation}T${r.start_time}`),
          end: new Date(`${r.date_of_reservation}T${r.end_time}`),
        }))
        setEvents(mapped)
      })
  }

  useEffect(() => {
    loadReservations()
  }, [])

  const selectedEnd =
    selectedStart && selectedDuration
      ? new Date(selectedStart.getTime() + selectedDuration * 60 * 1000)
      : null

  const freeCourts =
    selectedStart && selectedEnd
      ? courts.filter((court) => isCourtAvailable(court.id, selectedStart, selectedEnd, events))
      : []

  const handleConfirm = async () => {
    if (!selectedCourt || !selectedStart || !selectedEnd) return

    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        court_id: selectedCourt.id,
        player_id: 1, // temporal, lo sustituiremos por el selector
        date_of_reservation: format(selectedStart, 'yyyy-MM-dd'),
        start_time: format(selectedStart, 'HH:mm:ss'),
        end_time: format(selectedEnd, 'HH:mm:ss'),
      }),
    })

    if (response.ok) {
      loadReservations()
      setSelectedCourt(null)
      setSelectedStart(null)
      setSelectedDuration(null)
    } else {
      alert('No se pudo crear la reserva')
    }
  }

  return (
    <div>
      {view === Views.DAY ? (
        <div>
          <button
            onClick={() => {
              setView(Views.MONTH)
              setSelectedStart(null)
              setSelectedDuration(null)
              setSelectedCourt(null)
            }}
          >
            ← Volver al calendario
          </button>
          <h2>{date.toLocaleDateString()}</h2>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {generateStartTimes(date).map((start) => (
              <button
                key={start.toISOString()}
                onClick={() => {
                  setSelectedStart(start)
                  setSelectedDuration(null)
                  setSelectedCourt(null)
                }}
                style={{ padding: '16px 24px', borderRadius: '8px', cursor: 'pointer' }}
              >
                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </button>
            ))}
          </div>

          {selectedStart && (
            <div>
              <h3>Duración</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[60, 90].map((minutes) => {
                  const end = new Date(selectedStart.getTime() + minutes * 60 * 1000)
                  const closing = new Date(date)
                  closing.setHours(22, 0, 0, 0)
                  return (
                    <button
                      key={minutes}
                      disabled={end > closing}
                      onClick={() => {
                        setSelectedDuration(minutes)
                        setSelectedCourt(null)
                      }}
                    >
                      {minutes === 60 ? '1 hora' : '1 hora y media'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {selectedStart && selectedEnd && (
            <div>
              <h3>Pistas libres</h3>
              {freeCourts.length === 0 ? (
                <p>No hay pistas libres a esa hora.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {freeCourts.map((court) => (
                    <button key={court.id} onClick={() => setSelectedCourt(court)}>
                      {court.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedCourt && selectedStart && selectedEnd && (
            <div>
              <h3>Confirmar reserva</h3>
              <p>
                ¿Quieres reservar el {selectedStart.toLocaleDateString()} de{' '}
                {selectedStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} a{' '}
                {selectedEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} en la{' '}
                {selectedCourt.name}?
              </p>
              <button onClick={handleConfirm}>Sí</button>
              <button onClick={() => setSelectedCourt(null)}>No</button>
            </div>
          )}
        </div>
      ) : (
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '600px' }}
          views={['month']}
          view={Views.MONTH}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          onDrillDown={(clickedDate) => {
            setDate(clickedDate)
            setView(Views.DAY)
          }}
        />
      )}
    </div>
  )
}

export default PadelBooking