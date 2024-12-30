'use client'

import React, { useState } from 'react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import Image from 'next/image'
import './style.css'

type Producto = {
  id: string
  nombre: string
  precio: number
  cantidad: number
  empresa: string
  imagen: string
  link: string
}

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buscarProductos = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    setResultadosBusqueda([])
    try {
      const response = await fetch(`/api/buscar-producto?query=${encodeURIComponent(busqueda)}`)
      const data = await response.json()
      
      if (response.status === 404) {
        setError('No se encontraron productos')
      } else if (!response.ok) {
        throw new Error(data.message || 'Error en la búsqueda')
      } else if (Array.isArray(data) && data.length > 0) {
        setResultadosBusqueda(data.map((p: Producto) => ({ ...p, cantidad: 1 })))
      } else {
        setError('No se encontraron productos')
      }
    } catch (error) {
      console.error('Error al buscar productos:', error)
      setError('Hubo un error al buscar productos. Por favor, intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const agregarProducto = (producto: Producto) => {
    setProductos([...productos, producto])
    setResultadosBusqueda([])
    setBusqueda('')
  }

  const eliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index))
  }

  const actualizarCantidad = (index: number, nuevaCantidad: number) => {
    const nuevosProductos = [...productos]
    nuevosProductos[index].cantidad = nuevaCantidad
    setProductos(nuevosProductos)
  }

  const total = productos.reduce((sum, producto) => sum + producto.precio * producto.cantidad, 0)

  const generarPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Función para agregar el encabezado
    const addHeader = () => {
      doc.setFillColor(52, 152, 219); // Color azul para el encabezado
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text('Presupuesto de Construcción', pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, margin, 38);
    };

    // Función para agregar el pie de página
    const addFooter = () => {
      const totalY = pageHeight - 20;
      doc.setFillColor(52, 152, 219);
      doc.rect(0, totalY - 10, pageWidth, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Total: $${total.toFixed(2)}`, pageWidth - margin, totalY, { align: 'right' });
    };

    // Agregar encabezado
    addHeader();

    // Preparar datos para la tabla
    const tableColumn = ["Producto", "Cantidad", "Precio Unitario", "Subtotal"];
    const tableRows = productos.map(producto => [
      producto.nombre,
      producto.cantidad,
      `$${producto.precio.toFixed(2)}`,
      `$${(producto.precio * producto.cantidad).toFixed(2)}`
    ]);

    // Agregar tabla de productos
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219], textColor: 255 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { top: 50, right: margin, bottom: 60, left: margin },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      },
      styles: { overflow: 'linebreak', cellPadding: 5 },
      didDrawPage: (data: any) => {
        addHeader();
        addFooter();
      }
    });

    // Agregar pie de página en la última página
    addFooter();

    // Guardar el PDF
    doc.save('presupuesto_construccion.pdf');
  }

  return (
    <main className="container">
      <h1 className="title">Presupuesto de Construcción</h1>
      
      <section className="step">
        <h2 className="step-title">
          <span className="step-number">1</span>
          Busca productos para tu proyecto
        </h2>
        <p className="step-description">
          Ingresa el nombre del producto que necesitas y haz clic en "Buscar" para encontrar las mejores opciones.
        </p>
        <form onSubmit={buscarProductos} className="search-form">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej: Clavos, Martillo, Cemento..."
            className="search-input"
            required
          />
          <button type="submit" className="search-button" disabled={cargando}>
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {resultadosBusqueda.length > 0 && (
          <div className="search-results">
            <h3 className="results-title">Resultados de búsqueda</h3>
            <div className="product-grid">
              {resultadosBusqueda.map((producto) => (
                <div key={producto.id} className="product-card">
                  <Image src={producto.imagen} alt={producto.nombre} width={200} height={200} className="product-image" />
                  <h4 className="product-name">{producto.nombre}</h4>
                  <p className="product-price">${producto.precio.toFixed(2)} - {producto.empresa}</p>
                  <a href={producto.link} target="_blank" rel="noopener noreferrer" className="product-link">
                    Ver en MercadoLibre
                  </a>
                  <button onClick={() => agregarProducto(producto)} className="add-button">
                    Agregar al presupuesto
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {productos.length > 0 && (
        <section className="step">
          <h2 className="step-title">
            <span className="step-number">2</span>
            Revisa y ajusta tu lista de productos
          </h2>
          <p className="step-description">
            Aquí puedes ver todos los productos que has agregado a tu presupuesto. Ajusta las cantidades o elimina productos si es necesario.
          </p>
          <div className="product-list">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Empresa</th>
                  <th>Subtotal</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto, index) => (
                  <tr key={producto.id}>
                    <td>{producto.nombre}</td>
                    <td>${producto.precio.toFixed(2)}</td>
                    <td>
                      <input
                        type="number"
                        value={producto.cantidad}
                        onChange={(e) => actualizarCantidad(index, parseInt(e.target.value))}
                        min="1"
                        className="quantity-input"
                      />
                    </td>
                    <td>{producto.empresa}</td>
                    <td>${(producto.precio * producto.cantidad).toFixed(2)}</td>
                    <td>
                      <button onClick={() => eliminarProducto(index)} className="delete-button">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {productos.length > 0 && (
        <section className="step">
          <h2 className="step-title">
            <span className="step-number">3</span>
            Finaliza tu presupuesto
          </h2>
          <p className="step-description">
            Revisa el total de tu presupuesto y descarga un PDF con el resumen para tus registros o para compartir.
          </p>
          <div className="budget-summary">
            <p className="total-amount">Total: ${total.toFixed(2)}</p>
            <button onClick={generarPDF} className="download-button">
              Descargar PDF del Presupuesto
            </button>
          </div>
        </section>
      )}
    </main>
  )
}

