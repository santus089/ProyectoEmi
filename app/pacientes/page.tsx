"use client";

import React, { useEffect, useState } from 'react';

import Sidebar from '@/components/Sidebar';
import '@/app/estilos/main.css';
import '@/app/globals.css';
import '@/app/estilos/pacientes.css';

import { guardarPaciente, obtenerPaciente, actualizarPaciente, borrarPaciente } from '../action';

export default function PacientePage(){
    // mostrar formulario
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    //estados para almacenar pacientes
    const [pacientes, setPacientes] = useState<any[]>([]);
    const [cargandoLista, setCargandoLista] = useState(true);

    const [rut, setRut] = useState("");
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState("");
    const [telefono, setTelefono] = useState("");
    const [correo, setCorreo] = useState("");
    const [genero, setGenero] = useState("");

    // variables del listado
    const [guardando, setGuardando] = useState(false);

    // varibles del buscador
    const [terminoBusqueda, setTerminoBusqueda] = useState("");

    const pacientesFiltrados = pacientes.filter((paciente) =>{
        const texto = terminoBusqueda.toLocaleLowerCase().replace(/[\.\-]/g, "");
        const rutPaciente = (paciente.rut || "".toLowerCase().replace(/[\.\-]/g, ""));
        // Union nombre y apellido
        const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`. toLowerCase();

        return rutPaciente.includes(texto) || nombreCompleto.includes(texto);
    });
    
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idPacienteAEditar, setIdPacienteAEditar] = useState<number | null>(null);

    const abrirEditor = (paciente: any) => {
    setIdPacienteAEditar(paciente.id);
    setModoEdicion(true);

    setRut(paciente.rut || "");
    setNombre(paciente.nombre || "");
    setApellido(paciente.apellido || "");
    // Formateamos la fecha timestamp a YYYY-MM-DD para el input de tipo date
    if (paciente.fechaNacimiento) {
        setFechaNacimiento(paciente.fechaNacimiento.split('T')[0]);
    }
    setTelefono(paciente.telefono || "");
    setCorreo(paciente.correo || "");
    setGenero(paciente.genero || "");
    
    setMostrarFormulario(true); // Reutilizamos el mismo modal
    };
    

    // Calcular edad del paciente
    const calcularEdad = (fecha: string) => {
        if (!fecha) return "";
            const hoy = new Date()
            const cumpleanos = new Date(fecha);

            let edad = hoy.getFullYear() - cumpleanos.getFullYear();
            const mes = hoy.getMonth() - cumpleanos.getMonth();

        // Ajusta si el usuario aun no ha estado de cumpleanos
        if (mes < 0 || (mes === 0 && hoy.getDate() < cumpleanos.getDate())){
            edad--;
        }
        return edad >=0 ? edad : ""; // Evita numeros negativos como fecha
    }

    // funcion para cargar pacientes desde el servidor
    const cargarPacientes = async () => {
        setCargandoLista(true);
        const resultado = await obtenerPaciente();
        if (resultado.success) {
            setPacientes(resultado.data);
        } else {
            alert(`Error al cargar la lista: ${resultado.error}`);
        }
        setCargandoLista(false);
    }

    useEffect(() => {
        cargarPacientes();
    }, []);

    // constate del formulario de envio
    async function manejarEnvio(e:any) {
        e.preventDefault();
        setGuardando(true);

        const datosFormulario = {
            rut,
            nombre,
            apellido,
            fechaNacimiento,
            telefono,
            correo,
            genero
        };
        let resultado;

        if (modoEdicion && idPacienteAEditar !== null) {
            // Si está en modo edición, llama a actualizar
            resultado = await actualizarPaciente(idPacienteAEditar, datosFormulario);
        } else {
            // Si no, guarda uno nuevo
            resultado = await guardarPaciente(datosFormulario);
        }

        setGuardando(false);

        if (resultado.success){
            alert(modoEdicion ? "!Paciente actualizado exitosamente!" : "¡Paciente guardado exitosamente")
            setRut("");
            setNombre("");
            setApellido("");
            setFechaNacimiento("");
            setTelefono("");
            setCorreo("");
            setGenero("");
            setMostrarFormulario(false);

            setMostrarFormulario(false);
            setModoEdicion(false);
            setIdPacienteAEditar(null);

            cargarPacientes();
        } else {
            alert(`Error: ${resultado.error}`);
        }
    }

    const manejarBorrar = async (id: number, nombrePaciente: string) => {
    const confirmar = window.confirm(`¿Estás seguro de querer eliminar permanentemente a ${nombrePaciente}?`);
    if (confirmar) {
        const resultado = await borrarPaciente(id);
        if (resultado.success) {
            alert("¡Paciente eliminado exitosamente de la base de datos!");
            cargarPacientes(); // Refresca la lista automáticamente
        } else {
            alert(`Error al eliminar: ${resultado.error}`);
        }
        
        }
    };

    const cerrarModal = () => {
        setMostrarFormulario(false);
        setModoEdicion(false);
        setIdPacienteAEditar(null);
        setRut(""); setNombre(""); setApellido(""); setFechaNacimiento(""); setTelefono(""); setCorreo(""); setGenero("");
    };

    const abrirFormularioNuevo = () => {
    // Aseguramos que NO esté en modo edición ni tenga IDs colgados
        setModoEdicion(false);
        setIdPacienteAEditar(null);

        // Vaciamos todos los campos del formulario
        setRut("");
        setNombre("");
        setApellido("");
        setFechaNacimiento("");
        setTelefono("");
        setCorreo("");
        setGenero("");

        // Recién ahí abrimos el modal limpio
        setMostrarFormulario(true);
    };
    return(
        <main className="main-layout">
            {/* Sidebar y card de ingreso pacientes */}
            <div className='app-container'>
                <Sidebar/>
                <div className='content-container'style={{backgroundColor: '#525e92', padding: '1rem'}}>
                    <div className='card-paciente'>
                        <div className="paciente-header-row">
                            <h1>Pacientes</h1>
                            <button onClick={abrirFormularioNuevo}>Agregar paciente</button>
                        </div>
                        
                        {/*Barra de búsqueda */}
                        <div className="search-wrapper">
                            <input 
                                type="text" 
                                placeholder="Buscar paciente por RUT() o Nombre..." 
                                className="search-input"
                                value={terminoBusqueda || ""}
                                onChange={(e) => setTerminoBusqueda(e.target.value)}
                            />
                        </div>

                    </div>
                    {/* listado de pacientes */}
                    <div className='pacientes-lista-container' style={{marginTop: '2rem', backgroundColor: '#ffffff', borderRadius: '12px'}}>
                            {cargandoLista ? (
                                <p style={{color: '#fff'}}>Cargando pacientes...</p>
                            ) : pacientes.length === 0 ? (
                                <p style={{color: '#fff', alignItems: 'center'}}>No hay pacientes registrados</p>
                            ) : (
                                <div className='tabla-pacientes-wrapper'>
                                    <table className='tabla-pacientes' style={{width: '100%', borderCollapse: 'collapse', }}>
                                        <thead style={{borderBottom: '1px solid #000000'}}>
                                            <tr style={{textAlign: 'left'}}>
                                                <th style={{padding: '0.5rem'}}>Nombre Completo</th>
                                                <th style={{padding: '0.5rem'}}>Correo Electronico</th>
                                                <th style={{padding: '0.5rem', textAlign: 'right'}}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pacientesFiltrados.map((paciente) => (
                                                <tr key={paciente.id} style={{}}>
                                                    <td style={{ padding: '0.8rem 0.5rem' }}>
                                                        {paciente.nombre} {paciente.apellido}
                                                    </td>
                                                    <td style={{ padding: '0.8rem 0.5rem' }}>
                                                        {paciente.correo}
                                                    </td>
                                                    <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right' }}>
                                                        {/* Botón Editar (Solo visual por ahora) */}
                                                        <button 
                                                            style={{ marginRight: '0.5rem', backgroundColor: '#f0a500', color: '#white', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}
                                                            onClick={() => abrirEditor(paciente)}
                                                        >
                                                            Editar
                                                        </button>
                                                        {/* Botón Borrar */}
                                                        <button 
                                                            style={{ backgroundColor: '#d9534f', color: '#white', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}
                                                            onClick={() => manejarBorrar(paciente.id, `${paciente.nombre} ${paciente.apellido}`)}
                                                        >
                                                            Borrar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )};
                        {/* fin listado de paciente */}
                    </div>
                </div>

            </div>

            {/* Codigo del formulario */}
            {mostrarFormulario && (
                <div className='modal-overlay'>
                    <div className='modal-form-card'>
                        <div className='modal-header'>
                            <h2>Agregar Nuevo Paciente</h2>
                            <button type='button' className= "btn-cerrar-x" onClick={cerrarModal}>&times;</button>
                        </div>
                        <form onSubmit={manejarEnvio} className="paciente-form">
                            {/* Rut, apellido y nombre */}
                            <div className='form-row'>
                                <div className='form-group'>
                                    <label>RUT o RUN</label>
                                    <input 
                                        type="text"
                                        value={rut}
                                        onChange={(e) => setRut(e.target.value)} 
                                        required/>
                                </div>
                                <div className='form-group'>
                                    <label>Nombre</label>
                                    <input 
                                        type="text" 
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        required/>
                                </div>
                                <div className='form-group'>
                                    <label>Apellido</label>
                                    <input 
                                        type="text"
                                        value={apellido}
                                        onChange={(e) => setApellido(e.target.value)} 
                                        required/>
                                </div>
                            </div>
                            {/* Fecha de nacimiento, edad y telefono */}
                            <div className='form-row-triple'>
                                <div className='form-group'>
                                    <label>Fecha de Nacimiento</label>
                                    <input 
                                        type="date" 
                                        value={fechaNacimiento}
                                        onChange={(e) => setFechaNacimiento(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className='form-group'>
                                    <label>Edad</label>
                                    <input 
                                        type="text"
                                        placeholder="--" 
                                        readOnly
                                        value={calcularEdad(fechaNacimiento)}
                                    />
                                </div>
                                <div className='form-group'>
                                    <label>Teléfono</label>
                                    <input 
                                        type="text"
                                        value={telefono}
                                        required
                                        onChange={(e) => setTelefono(e.target.value)}
                                    />
                                </div>
                            </div>
                            {/* Correo electronico */}
                            <div className='form-row'>
                                <div className='form-group'>
                                    <label>Correo Electronico</label>
                                    <input
                                        type="email"
                                        placeholder='ejemplo_de_correo@gmail.com'
                                        value={correo}
                                        onChange={(e) => setCorreo(e.target.value)}
                                        required/>
                                </div>
                                <div className='form-group'>
                                    <label>Genero</label>
                                    <select value={genero}
                                        onChange={(e) => setGenero(e.target.value)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            borderRadius: '4px',
                                            backgroundColor: '#fff',
                                            color: '#333',
                                            border: '1px solid #ccc'
                                        }}
                                    >
                                        <option value="" disabled>Eliga uno...</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="No-binario">No-binario</option>
                                    </select>
                                </div>
                            </div>
                            {/* Boton de cancelar y guardar */}
                            <div className='form-action'>
                                <button type='button' className='btn-cancelar' onClick={cerrarModal}>Cancelar</button>
                                <button type='submit' className='btn-guardar' disabled ={guardando}> 
                                    {guardando ? "Guardando..." : "Guardar Paciente"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}