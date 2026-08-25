import Link from 'next/link';
import { User, CalendarSearch, ClipboardCheck, Activity, Dumbbell } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <Link href='/' style={{ padding: '2rem', fontFamily: 'ui-sans-serif', fontWeight: 'bold', justifyContent: 'center'}}>
        INICIO
      </Link>
      <ul>
        <li><Link href="/pacientes"><User size={18}/>Pacientes</Link></li>
        <li><Link href="/agenda"><CalendarSearch size={18}/>Agenda</Link></li>
        <li><Link href="/evaluacion"><ClipboardCheck size={18}/>Evaluación</Link></li>
        <li><Link href="/entrenamiento"><Dumbbell size={18}/>Entrenamiento</Link></li>
        <li><Link href="/seguimiento"><Activity size={18}/>Seguimiento</Link></li>
      </ul>
    </aside>
  );
}