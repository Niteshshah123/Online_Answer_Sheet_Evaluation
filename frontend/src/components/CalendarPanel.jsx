import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'cal_notes';

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveNotes(n) { localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); }

function fmt(y, m, d) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarPanel({ onClose }) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState(fmt(today.getFullYear(), today.getMonth(), today.getDate()));
  const [notes, setNotes] = useState(loadNotes);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const todayKey = fmt(today.getFullYear(), today.getMonth(), today.getDate());

  useEffect(() => {
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [selected]);

  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function firstDay(y, m) { return new Date(y, m, 1).getDay(); }

  function prevMonth() {
    setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  }
  function nextMonth() {
    setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });
  }

  function addTodo() {
    const text = input.trim();
    if (!text) return;
    const updated = {
      ...notes,
      [selected]: {
        todos: [...(notes[selected]?.todos || []), { id: Date.now(), text, done: false }],
      }
    };
    setNotes(updated); saveNotes(updated); setInput('');
  }

  function toggleTodo(id) {
    const todos = (notes[selected]?.todos || []).map(t => t.id === id ? { ...t, done: !t.done } : t);
    const updated = { ...notes, [selected]: { ...notes[selected], todos } };
    setNotes(updated); saveNotes(updated);
  }

  function deleteTodo(id) {
    const todos = (notes[selected]?.todos || []).filter(t => t.id !== id);
    const updated = { ...notes, [selected]: { ...notes[selected], todos } };
    setNotes(updated); saveNotes(updated);
  }

  const total = daysInMonth(view.y, view.m);
  const start = firstDay(view.y, view.m);
  const cells = Array.from({ length: Math.ceil((start + total) / 7) * 7 }, (_, i) => {
    const d = i - start + 1;
    return (d >= 1 && d <= total) ? d : null;
  });

  const selectedTodos = notes[selected]?.todos || [];
  const selDate = new Date(selected + 'T00:00:00');
  const selLabel = selDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="cal-panel">
      {/* Header */}
      <div className="cal-header">
        <span className="cal-header-title">Calendar & Tasks</span>
        <button className="cal-close" onClick={onClose}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Month nav */}
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="cal-month-label">{MONTHS[view.m]} {view.y}</span>
        <button className="cal-nav-btn" onClick={nextMonth}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="cal-grid">
        {DAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = fmt(view.y, view.m, d);
          const isToday = key === todayKey;
          const isSel = key === selected;
          const hasTodos = (notes[key]?.todos?.length || 0) > 0;
          const allDone = hasTodos && notes[key].todos.every(t => t.done);
          return (
            <button
              key={i}
              className={`cal-day${isToday ? ' cal-today' : ''}${isSel ? ' cal-selected' : ''}`}
              onClick={() => setSelected(key)}
            >
              {d}
              {hasTodos && <span className={`cal-dot${allDone ? ' cal-dot-done' : ''}`} />}
            </button>
          );
        })}
      </div>

      {/* Selected day todos */}
      <div className="cal-todos">
        <div className="cal-todos-header">
          <span className="cal-todos-date">{selLabel}</span>
          {selected === todayKey && <span className="cal-today-badge">Today</span>}
        </div>

        <div className="cal-todo-input-row">
          <input
            ref={inputRef}
            className="cal-todo-input"
            placeholder="Add a task or note…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
          />
          <button className="cal-todo-add" onClick={addTodo} disabled={!input.trim()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        {selectedTodos.length === 0
          ? <p className="cal-empty">No tasks for this day.</p>
          : (
            <ul className="cal-todo-list">
              {selectedTodos.map(t => (
                <li key={t.id} className={`cal-todo-item${t.done ? ' done' : ''}`}>
                  <button className="cal-todo-check" onClick={() => toggleTodo(t.id)}>
                    {t.done
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <span className="cal-todo-circle" />
                    }
                  </button>
                  <span className="cal-todo-text">{t.text}</span>
                  <button className="cal-todo-del" onClick={() => deleteTodo(t.id)}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </li>
              ))}
            </ul>
          )
        }
      </div>
    </div>
  );
}
