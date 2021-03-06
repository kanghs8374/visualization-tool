/* eslint-disable no-unused-expressions */
/**
 * Simulation result viewer
 * This vue is divided into two cases.
 * 1: when the simulation is running
 * 2: when the simulation is finihsed
 */
import StepPlayer from '@/stepper/step-runner';
import stepperMixin from '@/stepper/mixin';
// import * as d3 from 'd3'
import * as R from 'ramda'
import makeMap from '@/map2/make-map';
import MapManager from '@/map2/map-manager';

import WebSocketClient from '@/realtime/ws-client';

import simulationService from '@/service/simulation-service';

import SimulationResult from '@/pages/SimulationResult.vue';

import HistogramChart from '@/components/charts/HistogramChart';
import Doughnut from '@/components/charts/Doughnut';
import statisticsService from '@/service/statistics-service';
import congestionColor from '@/utils/colors';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import UniqCongestionColorBar from '@/components/CongestionColorBar';
import UniqSimulationResultExt from '@/components/UniqSimulationResultExt';
import UniqMapChanger from '@/components/UniqMapChanger';

import SimulationDetailsOnRunning from '@/components/SimulationDetailsOnRunning';
import SimulationDetailsOnFinished from '@/components/SimulationDetailsOnFinished';

import bins from '@/stats/histogram'

import region from '@/map2/region'
import config from '@/stats/config'

const pieDefault = () => ({
  datasets: [{
    data: [1, 1, 1],
    backgroundColor:["red","orange","green"],
  }],
  labels: [ '막힘', '정체', '원활' ],
})



const makeLinkSpeedChartData = (data1, data2, data3) => {
  const dataset = (label, color, data) => ({
    label,
    fill: false,
    borderColor: color,
    backgroundColor: color,
    borderWidth: 2,
    pointRadius: 1,
    data,
  })

  return {
    labels: new Array(data2.length).fill(0).map((_, i) => i),
    datasets: [
      dataset('링크속도', '#7FFFD4', data1),
      dataset('평균속도', '#1E90FF', data2),
      dataset('제한속도', '#FF0000', data3),
    ],
  }
}

const { log } = console

export default {
  name: 'SimulationResultMap',
  components: {
    SimulationResult,
    SimulationDetailsOnRunning,
    SimulationDetailsOnFinished,
    LineChart,
    BarChart,
    HistogramChart,
    Doughnut,
    UniqCongestionColorBar,
    UniqSimulationResultExt,
    UniqMapChanger
  },
  data() {
    return {
      simulationId: null,
      simulation: { configuration: {} },
      map: null,
      mapId: `map-${Math.floor(Math.random() * 100)}`,
      mapHeight: 1024, // map view height
      mapManager: null,
      speedsPerStep: {},
      sidebar: false,
      currentStep: 1,
      slideMax: 0,
      showLoading: false,
      congestionColor,
      currentEdge: null,
      playBtnToggle: false,
      player: null,
      wsClient: null,
      chart: {
        histogramDataStep: null,
        histogramData: null,
        pieDataStep: null,
        pieData: null,
        linkSpeeds: [],
      },
      currentZoom: '',
      currentExtent: '',
      wsStatus: 'ready',
      avgSpeed: 0.00,
      linkHover: '',
      progress: 0,
      focusData: {
        speed: 0.00
      },
      avgSpeedView: pieDefault(),
      avgSpeedFocus: pieDefault(),
      logs: [],
      bottomStyle: {
        height: '220px',
        borderRadius: '0px',
        overflowY:'auto',
        overflowX:'hidden',
        position: 'fixed',
        bottom: 0,
        width: '100%',
      },
      playerStyle: {
        zIndex: 999,
        position: 'fixed',
        width: '300px',
        bottom: '50px',
        left: '10px',
      }
    };
  },
  destroyed() {
    if (this.map) {
      this.map.remove();
    }
    if(this.stepPlayer) {
      this.stepPlayer.stop();
    }
    if(this.wsClient) {
      this.wsClient.close()
    }
    window.removeEventListener("resize", this.getWindowHeight);
  },
  async mounted() {
    this.simulationId = this.$route.params ? this.$route.params.id : null;
    this.showLoading = true
    this.resize()
    this.map = makeMap({ mapId: this.mapId });
    await this.updateSimulation()

    this.mapManager = MapManager({
      map: this.map,
      simulationId: this.simulationId,
      eventBus: this
    });

    this.mapManager.loadMapData();
    if (this.simulation.status === 'finished') {
      await this.updateChart()
    }
    this.wsClient = WebSocketClient({
      simulationId: this.simulationId,
      eventBus: this
    })
    this.wsClient.init()

    this.showLoading = false

    this.$on('link:selected', (link) => {
      this.currentEdge = link;
      if(link.speeds) {
        if(!this.speedsPerStep.datasets) {
          return;
        }
        this.chart.linkSpeeds = makeLinkSpeedChartData(
          link.speeds,
          this.speedsPerStep.datasets[0].data,
          new Array(link.speeds.length).fill(this.edgeSpeed())
        )
      }

      return;
    })

    this.$on('link:hover', (link) => {
      this.linkHover = link.LINK_ID
      return;
    })

    this.$on('salt:data', (d) => {
      this.avgSpeed = d.roads.map(road => road.speed).reduce((acc, cur) => {
        acc += cur
        return acc
      }, 0) / d.roads.length


      this.avgSpeedView = {
        datasets: [{
          data: bins(d.roads).map(R.prop('length')),
          backgroundColor:config.colorsOfSpeed2,
        }],
        labels: config.speeds
      }
    })

    this.$on('salt:status', async (status) => {
      this.addLog(`status: ${status.status}, progress: ${status.progress}`)
      this.progress = status.progress
      if(status.status ===1 && status.progress === 100) {
        // FINISHED
      }
    })

    this.$on('map:focus', (data) => {
      this.focusData = data
      this.avgSpeedFocus = {
        datasets: [{
          data: bins(data.realTimeEdges).map(R.prop('length')),
          backgroundColor:config.colorsOfSpeed2,
        }],
        labels: config.speeds
      }
      // console.log(bins(data.realTimeEdges))
      // console.log(data.realTimeEdges)
    })

    this.$on('salt:finished', async () => {
      log('**** SIMULATION FINISHED *****')
      await this.updateSimulation()
      await this.updateChart()
    })

    this.$on('map:moved', ({zoom, extent}) => {
      this.currentZoom = zoom
      this.currentExtent = [extent.min, extent.max]
    });

    this.$on('ws:open', () => {
      this.wsStatus = 'open'
    });

    this.$on('ws:error', (error) => {
      this.wsStatus = 'error'
      this.makeToast(error.message, 'warning')
    });

    this.$on('ws:close', () => {
      this.wsStatus = 'close'
      this.makeToast('ws connection closed', 'warning')
    });

    window.addEventListener('resize', this.resize);
  },
  methods: {
    ...stepperMixin,

    stop() {
      this.$emit('salt:stop', this.simulationId)
    },
    // toggleBottom() {
    //   if (this.bottomStyle.height === '220px') {
    //     this.bottomStyle.height = '390px'
    //     this.playerStyle.bottom = '400px'
    //   } else if (this.bottomStyle.height === '390px') {
    //     this.bottomStyle.height = '220px'
    //     this.playerStyle.bottom = '230px'
    //   }
    // },
    addLog(text) {

      this.logs.push(`${new Date().toLocaleTimeString()} ${text}`)
      if(this.logs.length > 5) {
        this.logs.shift()
      }
    },
    toggleFocusTool() {
      this.mapManager.toggleFocusTool()
    },
    toggleState() {
      return this.playBtnToggle ? 'M' : 'A'
    },
    async updateSimulation() {
      const { simulation, ticks } = await simulationService.getSimulationInfo(this.simulationId);
      this.simulation = simulation;
      this.slideMax = ticks - 1
    },
    async updateChart() {
      this.stepPlayer = StepPlayer(this.slideMax, this.stepForward.bind(this));
      this.chart.histogramDataStep = await statisticsService.getHistogramChart(this.simulationId, 0);
      this.chart.histogramData = await statisticsService.getHistogramChart(this.simulationId);
      this.chart.pieDataStep = await statisticsService.getPieChart(this.simulationId, 0);
      this.chart.pieData = await statisticsService.getPieChart(this.simulationId);
      this.speedsPerStep = await statisticsService.getSummaryChart(this.simulationId);
      this.chart.linkSpeeds = makeLinkSpeedChartData(
        [],
        this.speedsPerStep.datasets[0].data,
        new Array(this.speedsPerStep.datasets[0].data.length).fill(this.edgeSpeed())
      )
    },
    edgeSpeed() {
      if(this.currentEdge && this.currentEdge.speeds) {
        return this.currentEdge.speeds[this.currentStep] || 0
      }
      return 0
    },
    resize() {
      // this.mapHeight = window.innerHeight - 220; // update map height to current height
      this.mapHeight = window.innerHeight - 60; // update map height to current height
    },
    togglePlay() {
      this.playBtnToggle = !this.playBtnToggle;

      (this.playBtnToggle ? this.stepPlayer.start : this.stepPlayer.stop).bind(this)()
    },
    async stepChanged(step) {
      if(this.simulation.status === 'finished') {
        this.mapManager.changeStep(step);
        this.chart.pieDataStep = await statisticsService.getPieChart(this.simulationId, step);
        this.chart.histogramDataStep = await statisticsService.getHistogramChart(this.simulationId, step);
      }
    },
    centerTo(locationCode) {
      const center = region[locationCode] || region[1]
      this.map.animateTo({ center, }, { duration: 2000 })
    },
    makeToast(msg, variant='info') {
      this.$bvToast.toast(msg, {
        title: 'Notification',
        autoHideDelay: 5000,
        appendToast: false,
        variant,
        toaster: 'b-toaster-bottom-right'
      })
    },
    async connectWebSocket() {
      this.wsClient.init()
    },
  },
};
