import "./estilos/main.css"
import Link from 'next/link'
import { Users, CalendarSearch, ClipboardCheck, Activity, Dumbbell, User, Bold} from 'lucide-react';
import Sidebar from "@/components/Sidebar";
import GraficaMensual from "@/components/GraficaMensual";
import CalendarioVista from "@/components/Calendario";

export default function Home() {
  return (
    <main className="main-layout">
      <div className="app-container">
        {/* el sidebar */}
        <Sidebar/>
        
        {/* lado derecho de la pagina */}
        <div className="content-container" style={{backgroundColor: '#525e92', flex: 1, padding: '1rem'}}>
          
          {/* grilla de los cards superiores */}
          <div className="cards-grid">
            <div className="card">
              <h3>Pacientes activos</h3>
              <p className="card-number">24</p>
              <span className="card-tag">+12% este mes</span>
            </div>
            <div className="card">
              <h3>Evaulaciones</h3>
              <p className="card-number">24</p>
              <span className="card-tag">+12% este mes</span>
            </div>
            <div className="card">
              <h3>Entrenamientos</h3>
              <p className="card-number">24</p>
              <span className="card-tag">+12% este mes</span>
            </div>
            <div className="card">
              <h3>Plan nutricional</h3>
              <p className="card-number">24</p>
              <span className="card-tag">+12% este mes</span>
            </div>
          </div>

          {/* CONTENEDOR PRINCIPAL: Divide la pantalla en bloque Izquierdo y bloque Derecho */}
          <div style={{display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'stretch'}}>
            
            {/* NUEVA COLUMNA IZQUIERDA: Agrupa las Evaluaciones y la Gráfica */}
            <div style={{flex: 2.5, display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              
              {/* Card de evaluaciones por tipo */}
              <div className="card-evaluaciones" style={{ marginTop: 0 }}>
                <h4>EVALUACIONES POR TIPO</h4>
                <div className="evaluacion-fila">
                  <div className="texto-con-barra">
                    <h3>Evaluaciones Biocompartimental</h3>
                    <span className="barra-color color-azul"></span>
                    <span className="numero-final">2</span>
                  </div>
                </div>
                <div className="evaluacion-fila">
                  <div className="texto-con-barra">
                    <h3>Evaluaciones Pentacompartimental</h3>
                    <span className="barra-color color-verde"></span>
                    <span className="numero-final">5</span>
                  </div>
                </div>
                <div className="evaluacion-fila">
                  <div className="texto-con-barra">
                    <h3>Evaluaciones Antropometrica Clinica</h3>
                    <span className="barra-color color-naranja"></span>
                    <span className="numero-final">1</span>
                  </div>
                </div>
                <div className="evaluacion-fila">
                  <div className="texto-con-barra">
                    <h3>Evaluaciones Infante-Juvenil</h3>
                    <span className="barra-color color-morado"></span>
                    <span className="numero-final">50</span>
                  </div>
                </div>
              </div>

              {/* Mover la Gráfica Mensual aquí adentro para que se alinee a la izquierda */}
              <GraficaMensual />

            </div>

            {/* COLUMNA DERECHA: El calendario se queda aquí solito ocupando todo el alto */}
            <div style={{flex: 0.5, display: 'flex'}}>
              <CalendarioVista/>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}