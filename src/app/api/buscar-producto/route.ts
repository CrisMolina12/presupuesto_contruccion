import { NextResponse } from 'next/server'
import axios from 'axios'

interface MercadoLibreItem {
  id: string
  title: string
  price: number
  thumbnail: string
  permalink: string
}

async function buscarEnMercadoLibre(query: string) {
  try {
    console.log('Buscando en MercadoLibre:', query)
    const response = await axios.get(`https://api.mercadolibre.com/sites/MLC/search?q=${encodeURIComponent(query)}`)
    console.log('Respuesta de MercadoLibre recibida')
    
    const productos = response.data.results.map((item: MercadoLibreItem) => ({
      id: item.id,
      nombre: item.title,
      precio: item.price,
      empresa: 'MercadoLibre',
      imagen: item.thumbnail,
      link: item.permalink
    }))
    
    console.log('Productos encontrados en MercadoLibre:', productos.length)
    return productos
  } catch (error) {
    console.error('Error buscando en MercadoLibre:', error)
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  console.log('Iniciando búsqueda para:', query)

  const productos = await buscarEnMercadoLibre(query)

  console.log('Total de productos encontrados:', productos.length)

  if (productos.length === 0) {
    return NextResponse.json({ message: 'No se encontraron productos' }, { status: 404 })
  }

  return NextResponse.json(productos)
}

