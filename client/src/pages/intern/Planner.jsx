import { useState, useEffect } from 'react';
import { getPlannerEvents, createPlannerEvent, deletePlannerEvent } from '../../api/planner';
import Modal from '../../components/Modal';
import { Plus, Trash2, ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react';

export default function Planner() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', startDate: '', startTime: '10:00', endDate: '', endTime: '17:00', allDay: false, description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try { const res = await getPlannerEvents(); setEvents(res.data.data); }
    catch {} finally { setLoading(false); }
  };

  const openNewEvent = () => {
    setForm({ title: '', startDate: selectedDate, startTime: '10:00', endDate: selectedDate, endTime: '17:00', allDay: false, description: '' });
    setModalOpen(true);
  };

  const handleCreate = async () => {
    if (!form.title) return;
    setSubmitting(true);
    try {
      const startDate = form.allDay ? `${form.startDate}T00:00:00` : `${form.startDate}T${form.startTime}:00`;
      const endDate = form.allDay ? `${form.endDate}T23:59:59` : `${form.endDate}T${form.endTime}:00`;
      await createPlannerEvent({ title: form.title, startDate, endDate, allDay: form.allDay, description: form.description });
      setModalOpen(false); fetchEvents();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus event ini?')) return;
    try { await deletePlannerEvent(id); fetchEvents(); } catch {}
  };

  const getEventsForDate = (dateStr) => events.filter(e => { const s = e.startDate?.split('T')[0]; const en = e.endDate?.split('T')[0]; return dateStr >= s && dateStr <= en; });

  const getDaysInMonth = () => {
    const d = new Date(selectedDate);
    const year = d.getFullYear(); const month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const monthLabel = () => new Date(selectedDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const changeMonth = (d) => { const dt = new Date(selectedDate); dt.setMonth(dt.getMonth() + d); setSelectedDate(dt.toISOString().split('T')[0]); };
  const todayEvents = getEventsForDate(selectedDate);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in-up">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Planner</h1>
          <p className="page-subtitle">Atur jadwal dan kegiatan kamu</p>
        </div>
        <button onClick={openNewEvent} className="btn btn-primary"><Plus size={16} /> Add Event</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeMonth(-1)} className="btn btn-ghost p-2"><ChevronLeft size={18} /></button>
            <h2 className="text-base font-semibold capitalize" style={{ color: 'var(--color-text)' }}>{monthLabel()}</h2>
            <button onClick={() => changeMonth(1)} className="btn btn-ghost p-2"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} className="text-[11px] font-semibold py-2" style={{ color: 'var(--color-text-muted)' }}>{d}</div>
            ))}
            {getDaysInMonth().map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const dateStr = day.toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const hasEvents = getEventsForDate(dateStr).length > 0;
              return (
                <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                  className="relative p-1.5 sm:p-2 rounded-xl text-sm transition-all cursor-pointer hover:bg-gray-50"
                  style={isSelected ? { background: 'var(--color-primary)', color: 'white', fontWeight: 700, boxShadow: 'var(--shadow-glow)' }
                    : isToday ? { background: 'var(--color-primary-100)', color: 'var(--color-primary)', fontWeight: 700 }
                    : { color: 'var(--color-text)' }}
                >
                  {day.getDate()}
                  {hasEvents && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: isSelected ? 'white' : 'var(--color-accent)' }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Events panel */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            <CalendarDays size={14} />
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long' })}
          </h3>
          {todayEvents.length === 0 ? (
            <div className="card empty-state py-8">
              <CalendarDays size={28} className="empty-state-icon" />
              <p className="empty-state-text text-xs">Tidak ada event</p>
            </div>
          ) : (
            <div className="space-y-3 stagger-children">
              {todayEvents.map(event => (
                <div key={event.id} className="card animate-fade-in-up group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{event.title}</h4>
                      <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                        <Clock size={11} />
                        {event.allDay ? 'Seharian' : `${new Date(event.startDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.endDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                      {event.description && <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{event.description}</p>}
                    </div>
                    <button onClick={() => handleDelete(event.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 cursor-pointer flex-shrink-0" style={{ color: 'var(--color-danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Event">
        <div className="space-y-4">
          <div><label className="label">Title</label><input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Nama event" className="input" autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start Date</label><input type="date" value={form.startDate} onChange={(e) => setForm(p => ({ ...p, startDate: e.target.value }))} className="input" /></div>
            <div><label className="label">Start Time</label><input type="time" value={form.startTime} onChange={(e) => setForm(p => ({ ...p, startTime: e.target.value }))} className="input" disabled={form.allDay} /></div>
            <div><label className="label">End Date</label><input type="date" value={form.endDate} onChange={(e) => setForm(p => ({ ...p, endDate: e.target.value }))} className="input" /></div>
            <div><label className="label">End Time</label><input type="time" value={form.endTime} onChange={(e) => setForm(p => ({ ...p, endTime: e.target.value }))} className="input" disabled={form.allDay} /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.allDay} onChange={(e) => setForm(p => ({ ...p, allDay: e.target.checked }))} className="w-4 h-4 rounded accent-purple-600" />
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>All Day</span>
          </label>
          <div><label className="label">Detail</label><textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Deskripsi event..." className="input min-h-[72px] resize-none" rows={3} /></div>
          <button onClick={handleCreate} disabled={submitting || !form.title} className="btn btn-primary w-full py-2.5">
            {submitting ? <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : 'Create Event'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
