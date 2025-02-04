export interface Event {
    id: string
    name: string
    level: number
    map_id: number
    // Add other event properties as needed
  }
  
  export interface Map {
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
  
  export interface ContinentFloor {
    texture_dims: [number, number];
    clamped_view: [[number, number], [number, number]];
    regions: Record<string, Region>;
    id: number;
  }
  
  export interface Region {
    name: string;
    label_coord: [number, number];
    continent_rect: [[number, number], [number, number]];
    maps: Record<string, MapData>;
  }
  
  export interface MapData {
    name: string;
    min_level: number;
    max_level: number;
    default_floor: number;
    label_coord: [number, number];
    map_rect: [[number, number], [number, number]];
    continent_rect: [[number, number], [number, number]];
    points_of_interest: Record<string, PointOfInterest>;
    tasks: Record<string, Task>;
    skill_challenges: SkillChallenge[];
    sectors: Record<string, Sector>;
    adventures: any[];
    id: number;
    mastery_points: any[];
  }
  
  export interface PointOfInterest {
    name?: string;
    type: string;
    floor: number;
    coord: [number, number];
    id: number;
    chat_link: string;
    icon?: string;
  }
  
  export interface Task {
    objective: string;
    level: number;
    coord: [number, number];
    bounds: [number, number][];
    id: number;
    chat_link: string;
  }
  
  export interface SkillChallenge {
    coord: [number, number];
    id: string;
  }
  
  export interface Sector {
    name: string;
    level: number;
    coord: [number, number];
    bounds: [number, number][];
    id: number;
    chat_link: string;
  }
  