import type { ContinentFloor, Map, Event, GW2MapsResponse } from '../../types/gw2Api'

interface DbSchema {
  floors: {
    id: number
    continentId: number
    data: ContinentFloor
    updatedAt: string
  }[]
  maps: {
    id: number
    data: Map
    updatedAt: string
  }[]
  events: {
    data: Event[]
    updatedAt: string
  }
  mapsData: {
    data: GW2MapsResponse
    updatedAt: string
  }
}

class GW2Database {
  private data: DbSchema

  constructor() {
    const stored = localStorage.getItem('gw2db')
    this.data = stored ? JSON.parse(stored) : {
      floors: [],
      maps: [],
      events: { data: [], updatedAt: new Date().toISOString() },
      mapsData: { data: { maps: {} }, updatedAt: new Date().toISOString() }
    }
  }

  async init() {
    return this
  }

  private async save() {
    localStorage.setItem('gw2db', JSON.stringify(this.data))
  }

  async getFloor(continentId: number, floorId: number) {
    return this.data.floors.find(
      f => f.continentId === continentId && f.id === floorId
    )
  }

  async saveFloor(continentId: number, floorId: number, data: ContinentFloor) {
    const index = this.data.floors.findIndex(
      f => f.continentId === continentId && f.id === floorId
    )

    const entry = {
      id: floorId,
      continentId,
      data,
      updatedAt: new Date().toISOString()
    }

    if (index >= 0) {
      this.data.floors[index] = entry
    } else {
      this.data.floors.push(entry)
    }

    await this.save()
  }

  async getMap(mapId: number) {
    return this.data.maps.find(m => m.id === mapId)
  }

  async saveMap(mapId: number, data: Map) {
    const index = this.data.maps.findIndex(m => m.id === mapId)
    
    const entry = {
      id: mapId,
      data,
      updatedAt: new Date().toISOString()
    }

    if (index >= 0) {
      this.data.maps[index] = entry
    } else {
      this.data.maps.push(entry)
    }

    await this.save()
  }

  async getEvents() {
    return this.data.events
  }

  async saveEvents(data: Event[]) {
    this.data.events = {
      data,
      updatedAt: new Date().toISOString()
    }
    await this.save()
  }

  async getMaps() {
    return this.data.mapsData
  }

  async saveMaps(data: GW2MapsResponse) {
    this.data.mapsData = {
      data,
      updatedAt: new Date().toISOString()
    }
    await this.save()
  }
}

export const db = new GW2Database()
