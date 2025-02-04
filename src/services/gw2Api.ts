import type { Event, Map, ContinentFloor } from '../types/gw2Api'
import axios from 'axios'
import { db } from './db'

const API_BASE_URL_V2 = 'https://api.guildwars2.com/v2'
const API_BASE_URL_V1 = 'https://api.guildwars2.com/v1'

export const gw2Api = {
  async init() {
    await db.init()
  },

  async getEvents(): Promise<Event[]> {
    try {
      // Check cache first
      const cached = await db.getEvents()
      if (cached && isDataFresh(cached.updatedAt)) {
        return cached.data
      }

      // Fetch fresh data
      const response = await axios.get<Event[]>(`${API_BASE_URL_V2}/events`)
      await db.saveEvents(response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching GW2 events:', error)
      throw error
    }
  },
  
  async getMap(mapId: number): Promise<Map> {
    try {
      // Check cache first
      const cached = await db.getMap(mapId)
      if (cached && isDataFresh(cached.updatedAt)) {
        return cached.data
      }

      // Fetch fresh data
      const response = await axios.get<Map>(`${API_BASE_URL_V2}/maps/${mapId}`)
      await db.saveMap(mapId, response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching GW2 map:', error)
      throw error
    }
  },
  
  async getContinentFloors(floorIds: number[]): Promise<ContinentFloor[]> {
    try {
      const floors = await Promise.all(
        floorIds.map(async id => {
          // Check cache first
          const cached = await db.getFloor(1, id)
          if (cached && isDataFresh(cached.updatedAt)) {
            return cached.data
          }

          // Fetch fresh data
          const response = await axios.get<ContinentFloor>(
            `${API_BASE_URL_V2}/continents/1/floors/${id}`
          )
          await db.saveFloor(1, id, response.data)
          return response.data
        })
      )
      return floors
    } catch (error) {
      console.error('Error fetching continent floors:', error)
      throw error
    }
  },

  async getMapFloor(continentId: number, floorId: number) {
    try {
      // Check cache first
      const cached = await db.getFloor(continentId, floorId)
      if (cached && isDataFresh(cached.updatedAt)) {
        return cached.data
      }

      // Fetch fresh data from v1 API
      const response = await axios.get(
        `${API_BASE_URL_V1}/map_floor.json?continent_id=${continentId}&floor=${floorId}`
      )
      await db.saveFloor(continentId, floorId, response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching map floor:', error)
      throw error
    }
  }
}

// Helper to check if cached data is still fresh (24 hours)
function isDataFresh(updatedAt: string): boolean {
  const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  const lastUpdate = new Date(updatedAt).getTime()
  return Date.now() - lastUpdate < CACHE_DURATION
} 