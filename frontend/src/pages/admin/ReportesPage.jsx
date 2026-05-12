import { useEffect, useRef, useState } from 'react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download, FileText, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '../../services/api'

const colores = ['#38bdf8', '#22c55e', '#f59e0b', '#f43f5e', '#a78bfa']
const pdfColores = {
  azulOscuro: '#1E3A8A',
  azulMedio: '#2563EB',
  grisTexto: '#374151',
  grisClaro: '#F3F4F6',
  verde: '#16A34A',
  rojo: '#DC2626',
  blanco: '#FFFFFF',
  borde: '#D1D5DB',
}

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha'
  return new Date(fecha).toLocaleDateString('es-GT')
}

function formatearTexto(texto) {
  if (!texto) return 'Sin dato'

  const valores = {
    en_progreso: 'En progreso',
    planificacion: 'Planificacion',
    completada: 'Completada',
    completado: 'Completado',
    pendiente: 'Pendiente',
    cancelada: 'Cancelada',
    cancelado: 'Cancelado',
    en_revision: 'En revision',
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    urgente: 'Urgente',
    activo: 'Activo',
    inactivo: 'Inactivo',
  }

  return valores[texto] || texto.replaceAll('_', ' ').replace(/^\w/, (letra) => letra.toUpperCase())
}

function tieneDatos(lista) {
  return Array.isArray(lista) && lista.length > 0
}

function ReportesPage() {
  const previewRef = useRef(null)
  const [tab, setTab] = useState('general')
  const [general, setGeneral] = useState(null)
  const [proyectos, setProyectos] = useState([])
  const [clientes, setClientes] = useState([])
  const [grupos, setGrupos] = useState([])
  const [proyectoId, setProyectoId] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [reporteProyecto, setReporteProyecto] = useState(null)
  const [reporteCliente, setReporteCliente] = useState(null)
  const [reporteGrupo, setReporteGrupo] = useState(null)
  const [reporteTareasVencidas, setReporteTareasVencidas] = useState([])
  const [reporteProductividad, setReporteProductividad] = useState(null)
  const [filtrosProductividad, setFiltrosProductividad] = useState({ desde: '', hasta: '' })
  const [cargando, setCargando] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [error, setError] = useState('')
  const [mensajeExportacion, setMensajeExportacion] = useState('')

  useEffect(() => {
    const cargarInicial = async () => {
      try {
        setCargando(true)
        setError('')
        const [generalResp, proyectosResp, clientesResp, gruposResp] = await Promise.all([
          api.get('/reportes/general'),
          api.get('/proyectos'),
          api.get('/reportes/opciones/clientes'),
          api.get('/reportes/opciones/grupos'),
        ])

        setGeneral(generalResp.data)
        setProyectos(proyectosResp.data)
        setClientes(clientesResp.data)
        setGrupos(gruposResp.data)

        if (proyectosResp.data[0]) setProyectoId(String(proyectosResp.data[0].id_proyecto))
        if (clientesResp.data[0]) setClienteId(String(clientesResp.data[0].id_usuario))
        if (gruposResp.data[0]) setGrupoId(String(gruposResp.data[0].id_grupo))
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudieron cargar los reportes.')
      } finally {
        setCargando(false)
      }
    }

    cargarInicial()
  }, [])

  useEffect(() => {
    const cargarProyecto = async () => {
      if (!proyectoId) return

      try {
        setError('')
        const { data } = await api.get(`/reportes/proyecto/${proyectoId}`)
        setReporteProyecto(data)
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudo cargar el reporte del proyecto.')
      }
    }

    cargarProyecto()
  }, [proyectoId])

  useEffect(() => {
    const cargarCliente = async () => {
      if (!clienteId) return

      try {
        setError('')
        const { data } = await api.get(`/reportes/cliente/${clienteId}`)
        setReporteCliente(data)
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudo cargar el reporte del cliente.')
      }
    }

    cargarCliente()
  }, [clienteId])

  useEffect(() => {
    const cargarGrupo = async () => {
      if (!grupoId) return

      try {
        setError('')
        const { data } = await api.get(`/reportes/grupo/${grupoId}`)
        setReporteGrupo(data)
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudo cargar el reporte del grupo.')
      }
    }

    cargarGrupo()
  }, [grupoId])

  useEffect(() => {
    const cargarTareasVencidas = async () => {
      try {
        setError('')
        const { data } = await api.get('/reportes/tareas-vencidas')
        setReporteTareasVencidas(data)
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudo cargar el reporte de tareas vencidas.')
      }
    }

    cargarTareasVencidas()
  }, [])

  useEffect(() => {
    const cargarProductividad = async () => {
      try {
        setError('')
        const { data } = await api.get('/reportes/productividad', {
          params: {
            desde: filtrosProductividad.desde || undefined,
            hasta: filtrosProductividad.hasta || undefined,
          },
        })
        setReporteProductividad(data)
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudo cargar el reporte de productividad.')
      }
    }

    cargarProductividad()
  }, [filtrosProductividad])

  const agregarPortadaPDF = (doc, subtitulo) => {
    const fecha = new Date().toLocaleDateString('es-GT')
    const ancho = doc.internal.pageSize.getWidth()

    doc.setFont('helvetica', 'bold')
    doc.setFillColor(pdfColores.azulOscuro)
    doc.rect(0, 0, ancho, 42, 'F')
    doc.setTextColor(pdfColores.blanco)
    doc.setFontSize(22)
    doc.text('TechSolutions v2.0', 14, 18)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(subtitulo, 14, 28)
    doc.text(`Fecha de generacion: ${fecha}`, ancho - 14, 28, { align: 'right' })
  }

  const agregarFooterPDF = (doc) => {
    const totalPaginas = doc.internal.getNumberOfPages()
    const ancho = doc.internal.pageSize.getWidth()
    const alto = doc.internal.pageSize.getHeight()

    for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
      doc.setPage(pagina)
      doc.setDrawColor(pdfColores.borde)
      doc.line(14, alto - 14, ancho - 14, alto - 14)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(pdfColores.grisTexto)
      doc.text('TechSolutions v2.0', 14, alto - 8)
      doc.text(`Pagina ${pagina} de ${totalPaginas}`, ancho - 14, alto - 8, { align: 'right' })
    }
  }

  const agregarResumenEjecutivoPDF = (doc, texto, y) => {
    doc.setFillColor(pdfColores.grisClaro)
    doc.setDrawColor(pdfColores.borde)
    doc.roundedRect(14, y, 182, 25, 3, 3, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(pdfColores.azulOscuro)
    doc.text('Resumen ejecutivo', 20, y + 8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(pdfColores.grisTexto)
    doc.text(doc.splitTextToSize(texto, 170), 20, y + 15)
    return y + 35
  }

  const asegurarEspacioPDF = (doc, y, altoNecesario = 35) => {
    const alto = doc.internal.pageSize.getHeight()
    if (y + altoNecesario <= alto - 22) return y

    doc.addPage()
    return 22
  }

  const escribirSeccionPDF = (doc, titulo, y) => {
    const posicionY = asegurarEspacioPDF(doc, y, 22)
    doc.setDrawColor(pdfColores.azulMedio)
    doc.setLineWidth(0.6)
    doc.line(14, posicionY, 196, posicionY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(pdfColores.azulOscuro)
    doc.text(titulo, 14, posicionY + 8)
    return posicionY + 15
  }

  const dibujarMetricasPDF = (doc, metricas, y) => {
    let posicionY = asegurarEspacioPDF(doc, y, 50)
    const anchoTarjeta = 42
    const altoTarjeta = 24
    const espacio = 5

    metricas.forEach((metrica, index) => {
      const columna = index % 4
      if (index > 0 && columna === 0) {
        posicionY = asegurarEspacioPDF(doc, posicionY + altoTarjeta + 7, 32)
      }

      const x = 14 + columna * (anchoTarjeta + espacio)
      const valor = String(metrica.valor ?? 0)

      doc.setFillColor(pdfColores.grisClaro)
      doc.setDrawColor(pdfColores.borde)
      doc.roundedRect(x, posicionY, anchoTarjeta, altoTarjeta, 2, 2, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      doc.setTextColor(
        metrica.destacado === 'rojo'
          ? pdfColores.rojo
          : metrica.destacado === 'verde'
            ? pdfColores.verde
            : pdfColores.azulOscuro,
      )
      doc.text(valor, x + 4, posicionY + 10)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(pdfColores.grisTexto)
      doc.text(doc.splitTextToSize(metrica.etiqueta, anchoTarjeta - 8), x + 4, posicionY + 17)
    })

    return posicionY + altoTarjeta + 10
  }

  const agregarTablaPDF = (doc, { titulo, columnas, filas, startY }) => {
    const y = escribirSeccionPDF(doc, titulo, startY)
    const body = tieneDatos(filas) ? filas : [['Sin datos disponibles', ...columnas.slice(1).map(() => '')]]

    autoTable(doc, {
      startY: y,
      head: [columnas],
      body,
      theme: 'grid',
      margin: { left: 14, right: 14, bottom: 22 },
      headStyles: {
        fillColor: pdfColores.azulOscuro,
        textColor: pdfColores.blanco,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: pdfColores.grisClaro },
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        textColor: pdfColores.grisTexto,
        cellPadding: 3,
        lineColor: pdfColores.borde,
        lineWidth: 0.1,
      },
    })

    return doc.lastAutoTable.finalY + 12
  }

  const dibujarBarraProgresoPDF = (doc, progreso, y, etiqueta = 'Progreso') => {
    const valor = Math.max(0, Math.min(Number(progreso) || 0, 100))
    const ancho = 182
    const anchoActivo = (ancho * valor) / 100

    y = asegurarEspacioPDF(doc, y, 22)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(pdfColores.grisTexto)
    doc.text(`${etiqueta}: ${valor}%`, 14, y)
    doc.setFillColor(pdfColores.grisClaro)
    doc.roundedRect(14, y + 5, ancho, 8, 2, 2, 'F')
    doc.setFillColor(valor >= 100 ? pdfColores.verde : pdfColores.azulMedio)
    doc.roundedRect(14, y + 5, anchoActivo, 8, 2, 2, 'F')
    return y + 23
  }

  const exportarReporteGeneralPDF = async () => {
    if (!general) {
      setMensajeExportacion('No hay datos para exportar')
      return
    }

    try {
      setExportando(true)
      setMensajeExportacion('')
      const doc = new jsPDF()
      const metricas = [
        { etiqueta: 'Clientes', valor: general.total_clientes },
        { etiqueta: 'Grupos', valor: general.total_grupos },
        { etiqueta: 'Proyectos', valor: general.total_proyectos },
        { etiqueta: 'Tareas', valor: general.total_tareas },
        { etiqueta: 'Completadas', valor: general.tareas_completadas, destacado: 'verde' },
        { etiqueta: 'Pendientes', valor: general.tareas_pendientes },
        { etiqueta: 'Vencidas', valor: general.tareas_vencidas, destacado: 'rojo' },
        { etiqueta: 'Productividad', valor: `${general.productividad_general || 0}%` },
      ]

      agregarPortadaPDF(doc, 'Reporte General')
      let startY = agregarResumenEjecutivoPDF(
        doc,
        'Vista consolidada de clientes, grupos, proyectos, tareas y productividad general del sistema.',
        54,
      )
      startY = escribirSeccionPDF(doc, 'Metricas generales', startY)
      startY = dibujarMetricasPDF(doc, metricas, startY)
      startY = agregarTablaPDF(doc, {
        titulo: 'Proyectos por estado',
        columnas: ['Estado proyecto', 'Total'],
        filas: (general.proyectos_por_estado || []).map((item) => [formatearTexto(item.estado), item.total]),
        startY,
      })
      agregarTablaPDF(doc, {
        titulo: 'Tareas por estado',
        columnas: ['Estado tarea', 'Total'],
        filas: (general.tareas_por_estado || []).map((item) => [formatearTexto(item.estado), item.total]),
        startY,
      })

      agregarFooterPDF(doc)
      doc.save('reporte-techsolutions-general.pdf')
    } catch (error) {
      console.error(error)
      setMensajeExportacion('No se pudo exportar el PDF')
    } finally {
      setExportando(false)
    }
  }

  const exportarReporteProyectoPDF = async () => {
    if (!reporteProyecto) {
      setMensajeExportacion('No hay datos para exportar')
      return
    }

    try {
      setExportando(true)
      setMensajeExportacion('')
      const doc = new jsPDF()
      const { proyecto, metricas, clientes, grupos, tareas, progreso_individual } = reporteProyecto
      const metricasProyecto = [
        { etiqueta: 'Clientes', valor: metricas.total_clientes },
        { etiqueta: 'Grupos', valor: metricas.total_grupos },
        { etiqueta: 'Tareas', valor: metricas.total_tareas },
        { etiqueta: 'Completadas', valor: metricas.tareas_completadas, destacado: 'verde' },
        { etiqueta: 'Pendientes', valor: metricas.tareas_pendientes },
        { etiqueta: 'Vencidas', valor: metricas.tareas_vencidas, destacado: 'rojo' },
      ]

      agregarPortadaPDF(doc, 'Reporte de Proyecto')
      let startY = agregarResumenEjecutivoPDF(
        doc,
        `Informe detallado del proyecto ${proyecto.nombre}, con asignaciones, tareas, progreso y metricas operativas.`,
        54,
      )
      startY = agregarTablaPDF(doc, {
        titulo: 'Resumen del proyecto',
        columnas: ['Campo', 'Detalle'],
        filas: [
          ['Proyecto', proyecto.nombre],
          ['Descripcion', proyecto.descripcion || 'Sin descripcion'],
          ['Estado', formatearTexto(proyecto.estado)],
          ['Prioridad', formatearTexto(proyecto.prioridad)],
          ['Fecha inicio', formatearFecha(proyecto.fecha_inicio)],
          ['Fecha fin', formatearFecha(proyecto.fecha_fin)],
        ],
        startY,
      })
      startY = dibujarBarraProgresoPDF(doc, proyecto.progreso, startY)
      startY = escribirSeccionPDF(doc, 'Metricas del proyecto', startY)
      startY = dibujarMetricasPDF(doc, metricasProyecto, startY)
      startY = agregarTablaPDF(doc, {
        titulo: 'Clientes relacionados',
        columnas: ['Cliente', 'Empresa', 'Correo', 'Origen'],
        filas: (clientes || []).map((item) => [
          item.nombre,
          item.empresa || 'Sin empresa',
          item.correo || 'Sin correo',
          formatearTexto(item.origen),
        ]),
        startY,
      })
      startY = agregarTablaPDF(doc, {
        titulo: 'Grupos asignados',
        columnas: ['Grupo', 'Estado', 'Integrantes'],
        filas: (grupos || []).map((item) => [item.nombre, formatearTexto(item.estado), item.integrantes_count]),
        startY,
      })
      startY = agregarTablaPDF(doc, {
        titulo: 'Progreso individual',
        columnas: ['Cliente', 'Tareas', 'Progreso'],
        filas: (progreso_individual || []).map((item) => [
          item.nombre,
          `${item.tareas_completadas}/${item.total_tareas}`,
          `${item.progreso}%`,
        ]),
        startY,
      })
      agregarTablaPDF(doc, {
        titulo: 'Tareas',
        columnas: ['Tarea', 'Estado', 'Prioridad', 'Cliente', 'Fecha limite'],
        filas: (tareas || []).map((item) => [
          item.titulo,
          formatearTexto(item.estado),
          formatearTexto(item.prioridad),
          item.cliente_asignado || 'Sin asignar',
          formatearFecha(item.fecha_limite),
        ]),
        startY,
      })

      agregarFooterPDF(doc)
      doc.save('reporte-techsolutions-proyecto.pdf')
    } catch (error) {
      console.error(error)
      setMensajeExportacion('No se pudo exportar el PDF')
    } finally {
      setExportando(false)
    }
  }

  const exportarReporteClientePDF = async () => {
    if (!reporteCliente) {
      setMensajeExportacion('No hay datos para exportar')
      return
    }

    try {
      setExportando(true)
      setMensajeExportacion('')
      const doc = new jsPDF()
      const cliente = reporteCliente.datos_cliente
      const metricasCliente = [
        { etiqueta: 'Total tareas', valor: reporteCliente.total_tareas },
        { etiqueta: 'Completadas', valor: reporteCliente.tareas_completadas, destacado: 'verde' },
        { etiqueta: 'Pendientes', valor: reporteCliente.tareas_pendientes },
        { etiqueta: 'Vencidas', valor: reporteCliente.tareas_vencidas, destacado: 'rojo' },
        { etiqueta: 'Productividad', valor: `${reporteCliente.productividad || 0}%` },
        { etiqueta: 'Puntualidad', valor: `${reporteCliente.puntualidad || 0}%` },
      ]

      agregarPortadaPDF(doc, 'Reporte por Cliente')
      let startY = agregarResumenEjecutivoPDF(
        doc,
        `Analisis de asignaciones, productividad y cumplimiento del cliente ${cliente.nombre}.`,
        54,
      )
      startY = agregarTablaPDF(doc, {
        titulo: 'Datos del cliente',
        columnas: ['Campo', 'Detalle'],
        filas: [
          ['Nombre', cliente.nombre],
          ['Correo', cliente.correo],
          ['Empresa', cliente.empresa || 'Sin empresa'],
          ['Telefono', cliente.telefono || 'Sin telefono'],
          ['Estado', formatearTexto(cliente.estado)],
        ],
        startY,
      })
      startY = escribirSeccionPDF(doc, 'Metricas del cliente', startY)
      startY = dibujarMetricasPDF(doc, metricasCliente, startY)
      startY = agregarTablaPDF(doc, {
        titulo: 'Proyectos asignados',
        columnas: ['Proyecto', 'Estado', 'Prioridad', 'Progreso'],
        filas: (reporteCliente.proyectos_asignados || []).map((item) => [
          item.nombre,
          formatearTexto(item.estado),
          formatearTexto(item.prioridad),
          `${item.progreso || 0}%`,
        ]),
        startY,
      })
      startY = agregarTablaPDF(doc, {
        titulo: 'Tareas asignadas',
        columnas: ['Tarea', 'Proyecto', 'Estado', 'Prioridad', 'Fecha limite'],
        filas: (reporteCliente.tareas_asignadas || []).map((item) => [
          item.titulo,
          item.proyecto || 'Sin proyecto',
          formatearTexto(item.estado),
          formatearTexto(item.prioridad),
          formatearFecha(item.fecha_limite),
        ]),
        startY,
      })
      startY = agregarTablaPDF(doc, {
        titulo: 'Tareas por estado',
        columnas: ['Estado', 'Total'],
        filas: (reporteCliente.tareas_por_estado || []).map((item) => [formatearTexto(item.estado), item.total]),
        startY,
      })
      agregarTablaPDF(doc, {
        titulo: 'Tareas por prioridad',
        columnas: ['Prioridad', 'Total'],
        filas: (reporteCliente.tareas_por_prioridad || []).map((item) => [formatearTexto(item.prioridad), item.total]),
        startY,
      })

      agregarFooterPDF(doc)
      doc.save('reporte-techsolutions-cliente.pdf')
    } catch (error) {
      console.error(error)
      setMensajeExportacion('No se pudo exportar el PDF')
    } finally {
      setExportando(false)
    }
  }

  const exportarReporteGrupoPDF = async () => {
    if (!reporteGrupo) {
      setMensajeExportacion('No hay datos para exportar')
      return
    }

    try {
      setExportando(true)
      setMensajeExportacion('')
      const doc = new jsPDF()
      const grupo = reporteGrupo.datos_grupo
      const progreso = reporteGrupo.progreso_grupal || 0
      const metricasGrupo = [
        { etiqueta: 'Integrantes', valor: reporteGrupo.integrantes?.length || 0 },
        { etiqueta: 'Proyectos', valor: reporteGrupo.proyectos_relacionados?.length || 0 },
        { etiqueta: 'Tareas', valor: reporteGrupo.tareas_del_grupo?.length || 0 },
        { etiqueta: 'Progreso', valor: `${progreso}%`, destacado: Number(progreso) >= 100 ? 'verde' : undefined },
      ]

      agregarPortadaPDF(doc, 'Reporte por Grupo')
      let startY = agregarResumenEjecutivoPDF(
        doc,
        `Analisis consolidado del grupo ${grupo.nombre}, sus integrantes, proyectos relacionados y avance operativo.`,
        54,
      )
      startY = agregarTablaPDF(doc, {
        titulo: 'Datos del grupo',
        columnas: ['Campo', 'Detalle'],
        filas: [
          ['Nombre', grupo.nombre],
          ['Descripcion', grupo.descripcion || 'Sin descripcion'],
          ['Estado', formatearTexto(grupo.estado)],
          ['Fecha creacion', formatearFecha(grupo.fecha_creacion)],
        ],
        startY,
      })
      startY = dibujarBarraProgresoPDF(doc, progreso, startY, 'Progreso grupal')
      startY = escribirSeccionPDF(doc, 'Metricas del grupo', startY)
      startY = dibujarMetricasPDF(doc, metricasGrupo, startY)
      startY = agregarTablaPDF(doc, {
        titulo: 'Integrantes',
        columnas: ['Cliente', 'Empresa', 'Correo', 'Estado'],
        filas: (reporteGrupo.integrantes || []).map((item) => [
          item.nombre,
          item.empresa || 'Sin empresa',
          item.correo || 'Sin correo',
          formatearTexto(item.estado),
        ]),
        startY,
      })
      startY = agregarTablaPDF(doc, {
        titulo: 'Proyectos relacionados',
        columnas: ['Proyecto', 'Estado', 'Prioridad', 'Progreso'],
        filas: (reporteGrupo.proyectos_relacionados || []).map((item) => [
          item.nombre,
          formatearTexto(item.estado),
          formatearTexto(item.prioridad),
          `${item.progreso || 0}%`,
        ]),
        startY,
      })
      startY = agregarTablaPDF(doc, {
        titulo: 'Comparativa de integrantes',
        columnas: ['Cliente', 'Tareas', 'Completadas', 'Pendientes', 'Vencidas', 'Productividad'],
        filas: (reporteGrupo.comparativa_integrantes || []).map((item) => [
          item.cliente,
          item.total_tareas,
          item.completadas,
          item.pendientes,
          item.vencidas,
          `${item.productividad || 0}%`,
        ]),
        startY,
      })
      agregarTablaPDF(doc, {
        titulo: 'Tareas del grupo',
        columnas: ['Tarea', 'Proyecto', 'Cliente', 'Estado', 'Prioridad'],
        filas: (reporteGrupo.tareas_del_grupo || []).map((item) => [
          item.titulo,
          item.proyecto,
          item.cliente,
          formatearTexto(item.estado),
          formatearTexto(item.prioridad),
        ]),
        startY,
      })

      agregarFooterPDF(doc)
      doc.save('reporte-techsolutions-grupo.pdf')
    } catch (error) {
      console.error(error)
      setMensajeExportacion('No se pudo exportar el PDF')
    } finally {
      setExportando(false)
    }
  }

  const exportarReporteTareasVencidasPDF = async () => {
    if (!tieneDatos(reporteTareasVencidas)) {
      setMensajeExportacion('No hay datos para exportar')
      return
    }

    try {
      setExportando(true)
      setMensajeExportacion('')
      const doc = new jsPDF()
      const metricas = [
        { etiqueta: 'Tareas vencidas', valor: reporteTareasVencidas.length, destacado: 'rojo' },
        {
          etiqueta: 'Mayor atraso',
          valor: Math.max(...reporteTareasVencidas.map((item) => Number(item.dias_atraso) || 0)),
          destacado: 'rojo',
        },
      ]

      agregarPortadaPDF(doc, 'Reporte de Tareas Vencidas')
      let startY = agregarResumenEjecutivoPDF(
        doc,
        'Listado de tareas con fecha limite vencida y pendientes de finalizacion.',
        54,
      )
      startY = escribirSeccionPDF(doc, 'Metricas de vencimiento', startY)
      startY = dibujarMetricasPDF(doc, metricas, startY)
      agregarTablaPDF(doc, {
        titulo: 'Tareas vencidas',
        columnas: ['Tarea', 'Proyecto', 'Cliente', 'Prioridad', 'Fecha limite', 'Dias atraso'],
        filas: reporteTareasVencidas.map((item) => [
          item.tarea,
          item.proyecto,
          item.cliente,
          formatearTexto(item.prioridad),
          formatearFecha(item.fecha_limite),
          item.dias_atraso,
        ]),
        startY,
      })

      agregarFooterPDF(doc)
      doc.save('reporte-techsolutions-tareas-vencidas.pdf')
    } catch (error) {
      console.error(error)
      setMensajeExportacion('No se pudo exportar el PDF')
    } finally {
      setExportando(false)
    }
  }

  const exportarReporteProductividadPDF = async () => {
    if (!reporteProductividad) {
      setMensajeExportacion('No hay datos para exportar')
      return
    }

    try {
      setExportando(true)
      setMensajeExportacion('')
      const doc = new jsPDF()
      const { resumen, productividad_por_cliente, productividad_por_proyecto } = reporteProductividad
      const periodo =
        filtrosProductividad.desde || filtrosProductividad.hasta
          ? `${filtrosProductividad.desde || 'Inicio'} - ${filtrosProductividad.hasta || 'Actual'}`
          : 'Todo el historico'
      const metricas = [
        { etiqueta: 'Completadas', valor: resumen.total_completadas, destacado: 'verde' },
        { etiqueta: 'Productividad general', valor: `${resumen.productividad_general || 0}%` },
      ]

      agregarPortadaPDF(doc, 'Reporte de Productividad')
      let startY = agregarResumenEjecutivoPDF(
        doc,
        `Analisis de productividad para el periodo: ${periodo}.`,
        54,
      )
      startY = escribirSeccionPDF(doc, 'Resumen de productividad', startY)
      startY = dibujarMetricasPDF(doc, metricas, startY)
      startY = agregarTablaPDF(doc, {
        titulo: 'Productividad por cliente',
        columnas: ['Cliente', 'Tareas', 'Completadas', 'Pendientes', 'Vencidas', 'Productividad'],
        filas: (productividad_por_cliente || []).map((item) => [
          item.cliente,
          item.total_tareas,
          item.completadas,
          item.pendientes,
          item.vencidas,
          `${item.productividad || 0}%`,
        ]),
        startY,
      })
      agregarTablaPDF(doc, {
        titulo: 'Productividad por proyecto',
        columnas: ['Proyecto', 'Tareas', 'Completadas', 'Productividad'],
        filas: (productividad_por_proyecto || []).map((item) => [
          item.proyecto,
          item.total_tareas,
          item.completadas,
          `${item.productividad || 0}%`,
        ]),
        startY,
      })

      agregarFooterPDF(doc)
      doc.save('reporte-techsolutions-productividad.pdf')
    } catch (error) {
      console.error(error)
      setMensajeExportacion('No se pudo exportar el PDF')
    } finally {
      setExportando(false)
    }
  }

  const exportarPDF = () => {
    const exportadores = {
      general: exportarReporteGeneralPDF,
      proyecto: exportarReporteProyectoPDF,
      cliente: exportarReporteClientePDF,
      grupo: exportarReporteGrupoPDF,
      tareas_vencidas: exportarReporteTareasVencidasPDF,
      productividad: exportarReporteProductividadPDF,
    }

    exportadores[tab]()
  }

  const exportacionDeshabilitada =
    exportando ||
    (tab === 'proyecto' && !reporteProyecto) ||
    (tab === 'cliente' && !reporteCliente) ||
    (tab === 'grupo' && !reporteGrupo) ||
    (tab === 'productividad' && !reporteProductividad)

  if (cargando) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-800 bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      </div>
    )
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">
            Administracion
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white">Reportes PDF</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Genera reportes generales, por proyecto, por cliente, por grupo, tareas vencidas y productividad.
          </p>
        </div>
        <button
          type="button"
          onClick={exportarPDF}
          disabled={exportacionDeshabilitada}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
        >
          <Download className="h-4 w-4" />
          {exportando ? 'Exportando...' : 'Exportar PDF'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
          {error}
        </div>
      )}

      {mensajeExportacion && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-200">
          {mensajeExportacion}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2 rounded-lg border border-slate-800 bg-slate-900 p-2">
        <TabButton active={tab === 'general'} onClick={() => setTab('general')}>General</TabButton>
        <TabButton active={tab === 'proyecto'} onClick={() => setTab('proyecto')}>Proyecto</TabButton>
        <TabButton active={tab === 'cliente'} onClick={() => setTab('cliente')}>Cliente</TabButton>
        <TabButton active={tab === 'grupo'} onClick={() => setTab('grupo')}>Grupo</TabButton>
        <TabButton active={tab === 'tareas_vencidas'} onClick={() => setTab('tareas_vencidas')}>Tareas vencidas</TabButton>
        <TabButton active={tab === 'productividad'} onClick={() => setTab('productividad')}>Productividad</TabButton>
      </div>

      {tab === 'proyecto' && (
        <SelectorReporte
          label="Proyecto"
          value={proyectoId}
          onChange={setProyectoId}
          items={proyectos}
          getValue={(proyecto) => proyecto.id_proyecto}
          getLabel={(proyecto) => proyecto.nombre}
        />
      )}

      {tab === 'cliente' && (
        <SelectorReporte
          label="Cliente"
          value={clienteId}
          onChange={setClienteId}
          items={clientes}
          getValue={(cliente) => cliente.id_usuario}
          getLabel={(cliente) => `${cliente.nombre} - ${cliente.empresa || cliente.correo}`}
        />
      )}

      {tab === 'grupo' && (
        <SelectorReporte
          label="Grupo"
          value={grupoId}
          onChange={setGrupoId}
          items={grupos}
          getValue={(grupo) => grupo.id_grupo}
          getLabel={(grupo) => `${grupo.nombre} (${grupo.integrantes_count || 0} integrantes)`}
        />
      )}

      {tab === 'productividad' && (
        <div className="mb-6 grid gap-4 rounded-lg border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-200">Fecha desde</span>
            <input
              type="date"
              value={filtrosProductividad.desde}
              onChange={(event) => setFiltrosProductividad((actual) => ({ ...actual, desde: event.target.value }))}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-200">Fecha hasta</span>
            <input
              type="date"
              value={filtrosProductividad.hasta}
              onChange={(event) => setFiltrosProductividad((actual) => ({ ...actual, hasta: event.target.value }))}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
            />
          </label>
        </div>
      )}

      <div ref={previewRef} className="rounded-lg border border-slate-800 bg-white p-6 text-slate-950">
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">TechSolutions</p>
            <h3 className="mt-1 text-2xl font-bold">{titulosPreview[tab]}</h3>
          </div>
          <FileText className="h-8 w-8 text-slate-400" />
        </div>

        {tab === 'general' && general && <ReporteGeneralPreview data={general} />}
        {tab === 'proyecto' && reporteProyecto && <ReporteProyectoPreview data={reporteProyecto} />}
        {tab === 'cliente' && reporteCliente && <ReporteClientePreview data={reporteCliente} />}
        {tab === 'grupo' && reporteGrupo && <ReporteGrupoPreview data={reporteGrupo} />}
        {tab === 'tareas_vencidas' && <ReporteTareasVencidasPreview data={reporteTareasVencidas} />}
        {tab === 'productividad' && reporteProductividad && <ReporteProductividadPreview data={reporteProductividad} />}
      </div>
    </section>
  )
}

const titulosPreview = {
  general: 'Reporte General',
  proyecto: 'Reporte de Proyecto',
  cliente: 'Reporte por Cliente',
  grupo: 'Reporte por Grupo',
  tareas_vencidas: 'Reporte de Tareas Vencidas',
  productividad: 'Reporte de Productividad',
}

function SelectorReporte({ label, value, onChange, items, getValue, getLabel }) {
  return (
    <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900 p-4">
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">{label}</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
        >
          {items.map((item) => (
            <option key={getValue(item)} value={getValue(item)}>
              {getLabel(item)}
            </option>
          ))}
        </select>
      </label>
      {items.length === 0 && <p className="mt-3 text-sm text-slate-400">Sin datos disponibles</p>}
    </div>
  )
}

function ReporteGeneralPreview({ data }) {
  const kpis = [
    ['Clientes', data.total_clientes],
    ['Grupos', data.total_grupos],
    ['Proyectos', data.total_proyectos],
    ['Tareas', data.total_tareas],
    ['Completadas', data.tareas_completadas],
    ['Pendientes', data.tareas_pendientes],
    ['Vencidas', data.tareas_vencidas],
    ['Productividad', `${data.productividad_general}%`],
  ]

  return (
    <>
      <KpiGrid items={kpis} />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Proyectos por estado">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.proyectos_por_estado}>
              <XAxis dataKey="estado" tickFormatter={formatearTexto} />
              <YAxis allowDecimals={false} />
              <Tooltip labelFormatter={formatearTexto} />
              <Bar dataKey="total" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Tareas por estado">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.tareas_por_estado} dataKey="total" nameKey="estado" outerRadius={80}>
                {data.tareas_por_estado.map((entry, index) => (
                  <Cell key={entry.estado} fill={colores[index % colores.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, formatearTexto(name)]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  )
}

function ReporteProyectoPreview({ data }) {
  const { proyecto, metricas, tareas, progreso_individual } = data
  return (
    <>
      <ResumenProyecto proyecto={proyecto} />
      <KpiGrid
        items={[
          ['Clientes', metricas.total_clientes],
          ['Grupos', metricas.total_grupos],
          ['Tareas', metricas.total_tareas],
          ['Completadas', metricas.tareas_completadas],
          ['Pendientes', metricas.tareas_pendientes],
          ['Vencidas', metricas.tareas_vencidas],
        ]}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TablePreview
          title="Progreso individual"
          headers={['Cliente', 'Tareas', 'Progreso']}
          rows={progreso_individual.map((item) => [item.nombre, `${item.tareas_completadas}/${item.total_tareas}`, `${item.progreso}%`])}
        />
        <TablePreview
          title="Tareas"
          headers={['Tarea', 'Estado', 'Prioridad']}
          rows={tareas.slice(0, 8).map((item) => [item.titulo, formatearTexto(item.estado), formatearTexto(item.prioridad)])}
        />
      </div>
    </>
  )
}

function ReporteClientePreview({ data }) {
  const cliente = data.datos_cliente
  return (
    <>
      <div className="rounded-lg bg-slate-50 p-4">
        <h4 className="text-xl font-bold">{cliente.nombre}</h4>
        <p className="mt-2 text-sm text-slate-600">{cliente.empresa || cliente.correo}</p>
      </div>
      <KpiGrid
        items={[
          ['Total tareas', data.total_tareas],
          ['Completadas', data.tareas_completadas],
          ['Pendientes', data.tareas_pendientes],
          ['Vencidas', data.tareas_vencidas],
          ['Productividad', `${data.productividad}%`],
          ['Puntualidad', `${data.puntualidad}%`],
        ]}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TablePreview
          title="Proyectos asignados"
          headers={['Proyecto', 'Estado', 'Progreso']}
          rows={(data.proyectos_asignados || []).slice(0, 8).map((item) => [
            item.nombre,
            formatearTexto(item.estado),
            `${item.progreso || 0}%`,
          ])}
        />
        <TablePreview
          title="Tareas asignadas"
          headers={['Tarea', 'Proyecto', 'Estado']}
          rows={(data.tareas_asignadas || []).slice(0, 8).map((item) => [
            item.titulo,
            item.proyecto,
            formatearTexto(item.estado),
          ])}
        />
      </div>
    </>
  )
}

function ReporteGrupoPreview({ data }) {
  const grupo = data.datos_grupo
  return (
    <>
      <div className="rounded-lg bg-slate-50 p-4">
        <h4 className="text-xl font-bold">{grupo.nombre}</h4>
        <p className="mt-2 text-sm text-slate-600">{grupo.descripcion || 'Sin descripcion'}</p>
      </div>
      <KpiGrid
        items={[
          ['Integrantes', data.integrantes?.length || 0],
          ['Proyectos', data.proyectos_relacionados?.length || 0],
          ['Tareas', data.tareas_del_grupo?.length || 0],
          ['Progreso grupal', `${data.progreso_grupal || 0}%`],
        ]}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TablePreview
          title="Integrantes"
          headers={['Cliente', 'Empresa', 'Estado']}
          rows={(data.integrantes || []).map((item) => [
            item.nombre,
            item.empresa || 'Sin empresa',
            formatearTexto(item.estado),
          ])}
        />
        <TablePreview
          title="Comparativa"
          headers={['Cliente', 'Tareas', 'Productividad']}
          rows={(data.comparativa_integrantes || []).map((item) => [
            item.cliente,
            item.total_tareas,
            `${item.productividad || 0}%`,
          ])}
        />
      </div>
    </>
  )
}

function ReporteTareasVencidasPreview({ data }) {
  const mayorAtraso = tieneDatos(data)
    ? Math.max(...data.map((item) => Number(item.dias_atraso) || 0))
    : 0

  return (
    <>
      <KpiGrid
        items={[
          ['Tareas vencidas', data.length],
          ['Mayor atraso', `${mayorAtraso} dias`],
        ]}
      />
      <div className="mt-6">
        <TablePreview
          title="Tareas vencidas"
          headers={['Tarea', 'Proyecto', 'Cliente', 'Prioridad', 'Atraso']}
          rows={data.map((item) => [
            item.tarea,
            item.proyecto,
            item.cliente,
            formatearTexto(item.prioridad),
            `${item.dias_atraso} dias`,
          ])}
        />
      </div>
    </>
  )
}

function ReporteProductividadPreview({ data }) {
  const { resumen, productividad_por_cliente, productividad_por_proyecto } = data

  return (
    <>
      <KpiGrid
        items={[
          ['Completadas', resumen.total_completadas],
          ['Productividad general', `${resumen.productividad_general || 0}%`],
        ]}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TablePreview
          title="Productividad por cliente"
          headers={['Cliente', 'Tareas', 'Completadas', 'Productividad']}
          rows={(productividad_por_cliente || []).map((item) => [
            item.cliente,
            item.total_tareas,
            item.completadas,
            `${item.productividad || 0}%`,
          ])}
        />
        <TablePreview
          title="Productividad por proyecto"
          headers={['Proyecto', 'Tareas', 'Completadas', 'Productividad']}
          rows={(productividad_por_proyecto || []).map((item) => [
            item.proyecto,
            item.total_tareas,
            item.completadas,
            `${item.productividad || 0}%`,
          ])}
        />
      </div>
    </>
  )
}

function ResumenProyecto({ proyecto }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <h4 className="text-xl font-bold">{proyecto.nombre}</h4>
      <p className="mt-2 text-sm text-slate-600">{proyecto.descripcion || 'Sin descripcion'}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <SmallMetric label="Estado" value={formatearTexto(proyecto.estado)} />
        <SmallMetric label="Prioridad" value={formatearTexto(proyecto.prioridad)} />
        <SmallMetric label="Progreso" value={`${proyecto.progreso}%`} />
        <SmallMetric label="Fechas" value={`${formatearFecha(proyecto.fecha_inicio)} - ${formatearFecha(proyecto.fecha_fin)}`} />
      </div>
    </div>
  )
}

function KpiGrid({ items }) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([label, value]) => (
        <SmallMetric key={label} label={label} value={value} />
      ))}
    </div>
  )
}

function SmallMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h4 className="mb-3 font-bold">{title}</h4>
      {children}
    </div>
  )
}

function TablePreview({ title, headers, rows }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h4 className="mb-3 font-bold">{title}</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              {headers.map((header) => <th key={header} className="py-2 pr-3">{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="py-3 text-slate-500" colSpan={headers.length}>Sin datos disponibles</td>
              </tr>
            )}
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-slate-100">
                {row.map((cell, cellIndex) => <td key={cellIndex} className="py-2 pr-3">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  )
}

export default ReportesPage
