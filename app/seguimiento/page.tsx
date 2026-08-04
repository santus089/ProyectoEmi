import Sidebar from "@/components/Sidebar";
import '@/app/estilos/main.css';

export default function SeguimientoPage(){
    return(
        <main className="main-layout">
            <div className='app-container'>
                <Sidebar/>
            </div>
                <div className='content-container' style={{ backgroundColor: '#525e92', padding: '1.5rem', flexGrow: 1, overflowY: 'auto' }}>
                    
                </div>

        </main>
    )
}