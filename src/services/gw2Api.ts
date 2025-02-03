import axios from 'axios'

interface Event {
  id: string
  name: string
  level: number
  map_id: number
  // Add other event properties as needed
}

interface Map {
  id: number
  name: string
  min_level: number
  max_level: number
  default_floor: number
  floors: number[]
  region_id: number
  region_name: string
  continent_id: number
  continent_name: string
  map_rect: number[][]
  continent_rect: number[][]
  // Add other map properties as needed
}

const API_BASE_URL = 'https://api.guildwars2.com/v2'

export const gw2Api = {
  async getEvents(): Promise<Event[]> {
    try {
      const response = await axios.get<Event[]>(`${API_BASE_URL}/events`)
      return response.data
    } catch (error) {
      console.error('Error fetching GW2 events:', error)
      throw error
    }
  },
  
  async getMap(mapId: number): Promise<Map> {
    try {
      const response = await axios.get<Map>(`${API_BASE_URL}/maps/${mapId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching GW2 map:', error)
      throw error
    }
  }
} 