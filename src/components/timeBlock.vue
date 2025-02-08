<template>
  <div class="timeline-wrapper">
    <button 
      class="toggle-button" 
      @click="isOpen = !isOpen"
      :class="{ 'open': isOpen }"
    >
      ▼
    </button>
    <Transition name="slide">
      <div v-if="isOpen" class="timeline-container" :style="containerStyle">
        <apexchart
          id="timeline-chart"
          type="rangeBar"
          :height="height"
          width="100%"
          :options="chartOptions"
          :series="series"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import worldBossTimes from '@/assets/documents/worldbosstimers.json'
import ApexCharts from 'apexcharts'

declare global {
  interface Window {
    ApexCharts: any;
  }
}

// Define types for our chart data
interface EventData {
  x: string;
  y: number[];
  fillColor?: string;
  boss: string; // Add boss name for tooltip
}

interface SeriesData {
  name: string;
  data: EventData[];
}

// Add props
interface Props {
  height?: number;
  width?: string;
  background?: string;
}

const props = withDefaults(defineProps<Props>(), {
  height: 200,
  width: '100%',
  background: 'rgba(0, 0, 0, 0.8)'
})

// Computed style for container
const containerStyle = computed(() => ({
  width: props.width,
  background: props.background,
  padding: '10px',
  boxSizing: 'border-box' as const,
  overflow: 'hidden'
}))

// Get current time rounded down to nearest 15 minutes
const roundedNow = new Date()
roundedNow.setMinutes(Math.floor(roundedNow.getMinutes() / 15) * 15, 0, 0)

// Set default view to 2 hours
const defaultViewStart = new Date(roundedNow)
const defaultViewEnd = new Date(roundedNow)
defaultViewEnd.setHours(defaultViewEnd.getHours() + 2)

// Keep full day range for zoom out
const startOfDay = new Date(roundedNow)
startOfDay.setUTCHours(0, 0, 0, 0)
const endOfDay = new Date(roundedNow)
endOfDay.setUTCHours(23, 59, 59, 999)

// Time management
const currentTime = ref(new Date())
const timeInterval = ref<number>()

// Update time and view every 5 seconds
onMounted(() => {
  timeInterval.value = window.setInterval(() => {
    currentTime.value = new Date()
    updateChartView()
  }, 5000)
})

onUnmounted(() => {
  if (timeInterval.value) {
    clearInterval(timeInterval.value)
  }
})

// Get view window based on current time
const getViewWindow = () => {
  const now = currentTime.value
  const viewStart = new Date(now)
  viewStart.setHours(viewStart.getHours() - 1)
  const viewEnd = new Date(now)
  viewEnd.setHours(viewEnd.getHours() + 1)
  return { viewStart, viewEnd }
}

// Convert events to ApexCharts series format
const series = computed<SeriesData[]>(() => {
  const regularEvents: EventData[] = []
  const specialEvents: EventData[] = []
  
  const now = new Date().getTime()
  
  worldBossTimes.worldEvents.forEach(timeSlot => {
    timeSlot.bosses.forEach(boss => {
      // Parse the UTC time from the JSON
      const [utcHour, utcMinute] = boss.duration.start.split(':').map(Number)
      
      // Create a UTC date object
      const utcDate = new Date()
      utcDate.setUTCHours(utcHour, utcMinute, 0, 0)
      
      // Convert to local time
      const localStartTime = new Date(utcDate)
      const localEndTime = new Date(utcDate)
      
      // Set duration based on event type
      if (boss.type === 'regular') {
        localEndTime.setMinutes(localEndTime.getMinutes() + 15)
      } else {
        localEndTime.setMinutes(localEndTime.getMinutes() + 30)
      }

      // Check if event is currently active
      const isActive = now >= localStartTime.getTime() && now <= localEndTime.getTime()
      
      const eventData = {
        x: boss.type === 'regular' ? 'Regular Events' : 'Special Events',
        y: [localStartTime.getTime(), localEndTime.getTime()],
        fillColor: isActive 
          ? '#4F7942'  // pleasant green
          : boss.type === 'regular' 
            ? '#4a4a4a' 
            : '#8b0000',
        boss: boss.name
      }
      
      if (boss.type === 'regular') {
        regularEvents.push(eventData)
      } else {
        specialEvents.push(eventData)
      }
    })
  })

  return [
    {
      name: 'Regular Events',
      data: regularEvents
    },
    {
      name: 'Special Events',
      data: specialEvents
    }
  ]
})

// Chart options with annotations for current time
const chartOptions = computed(() => ({
  chart: {
    type: 'rangeBar' as const,
    animations: {
      enabled: false
    },
    toolbar: {
      show: false
    },
    background: 'transparent',
    zoom: {
      enabled: false
    }
  },
  plotOptions: {
    bar: {
      horizontal: true,
      distributed: false,
      dataLabels: {
        hideOverflowingLabels: true,
        position: 'center',
        maxItems: 100,
        trim: true,
        style: {
          fontSize: '12px'
        }
      },
      rangeBarOverlap: true,
      rangeBarGroupRows: false
    }
  },
  yaxis: {
    show: false
  },
  legend: {
    show: false
  },
  dataLabels: {
    enabled: true,
    formatter: function(val: any, opts: any) {
      const data = opts.w.config.series[opts.seriesIndex].data[opts.dataPointIndex]
      const start = data.y[0]
      const end = data.y[1]
      
      const xaxis = opts.w.config.xaxis
      if (start >= xaxis.min && end <= xaxis.max) {
        return data.boss
      }
      return ''
    },
    textAnchor: 'middle',
    style: {
      colors: ['#fff']
    }
  },
  annotations: {
    xaxis: [{
      x: currentTime.value.getTime(),
      borderColor: '#FF0000',
      borderWidth: 2,
      label: {
        borderColor: '#FF0000',
        style: {
          color: '#fff',
          background: '#FF0000'
        },
        text: 'Current Time'
      }
    }]
  },
  xaxis: {
    type: 'datetime',
    min: getViewWindow().viewStart.getTime(),
    max: getViewWindow().viewEnd.getTime(),
    labels: {
      format: 'HH:mm',
      style: {
        colors: '#fff'
      },
      datetimeUTC: false
    },
    tickAmount: 8
  },
  tooltip: {
    custom: function({ series, seriesIndex, dataPointIndex, w }: any) {
      const data = w.config.series[seriesIndex].data[dataPointIndex]
      const startTime = new Date(data.y[0]).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
      const endTime = new Date(data.y[1]).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
      return `<div class="custom-tooltip">
        <span>${data.boss}</span><br>
        <span>${startTime} - ${endTime}</span>
      </div>`
    }
  },
  theme: {
    mode: 'dark'
  }
}) as const);

const chart = ref<any>(null);

const updateChartView = () => {
  const { viewStart, viewEnd } = getViewWindow();
  if (chart.value) {
    chart.value.updateOptions({
      xaxis: {
        min: viewStart.getTime(),
        max: viewEnd.getTime()
      }
    });
  }
};

// Add isOpen state
const isOpen = ref(true)
</script>

<style scoped>
.timeline-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.toggle-button {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: none;
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1001;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.5); /* Add subtle shadow for visibility */
  padding: 0;
}

.toggle-button.open {
  transform: translateX(-50%) rotate(180deg);
}

.timeline-container {
  width: 100vw;
  max-width: 100%;
  background: rgba(0, 0, 0, 0.8);
  padding: 10px;
  box-sizing: border-box;
  overflow-x: hidden;
  border-radius: 4px 4px 0 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: none;
}

/* Slide animation */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-enter-to,
.slide-leave-from {
  transform: translateY(0);
  opacity: 1;
}

:deep(.custom-tooltip) {
  background: rgba(0, 0, 0, 0.8);
  padding: 8px;
  color: white;
}

:deep(.apexcharts-bar-area) {
  cursor: pointer;
}

:deep(.apexcharts-xaxis-annotation-label) {
  padding: 2px 5px;
  border-radius: 2px;
}
</style>
