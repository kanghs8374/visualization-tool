<template>
  <div id="simulation-comparison-result">
     <div class="top">
      <div class="center">

      </div>
    </div>
    <b-container fluid>
       <b-row>
        <!-- MAP1 -->
        <b-col cols="6" class="p-0">
          <b-card
            text-variant="white"
            border-variant="primary"
            bg-variant="primary"
            style="border-radius: 0px;"
            class="p-1"
            no-body
          >
            <b-card-text class="text-center m-0"> {{ selected[0] }} </b-card-text>
            <div :ref="mapId1" :id="mapId1" v-bind:style="{height: mapHeight + 'px'}"/>
          </b-card>
        </b-col>
        <!-- MAP2 -->
        <b-col cols="6" class="p-0">
          <b-card
            bg-variant="warning"
            border-variant="warning"
            style="border-radius: 0px;"
            class="p-1"
            no-body
          >
            <b-card-text class="text-center m-0"> <strong>{{ selected[1] }}</strong> </b-card-text>
            <div :ref="mapId2" :id="mapId2" v-bind:style="{height: mapHeight + 'px'}" />
          </b-card>
        </b-col>
      </b-row>

      <b-row>
        <b-col class="p-0">
          <b-card
            bg-variant="secondary"
            border-variant="secondary"
            style="border-radius: 0px;"
            class="p-1"
            no-body
          >
            <b-input-group size="small">
              <b-button-group size="small">
                <b-button variant="light">{{ currentStepTime }}</b-button>
                <b-button variant="light" @click="stepBackward"> &lsaquo; </b-button>
                <b-button variant="light" @click="stepForward"> &rsaquo; </b-button>
              </b-button-group>
              <b-input-group-prepend is-text class="ml-1">
                <b-form-checkbox
                  @change="togglePlay"
                  value="play"
                  unchecked-value="stop"
                />
              </b-input-group-prepend>
              <b-form-input
                type="range"
                min="1"
                :max="slideMax"
                :value="currentStep"
                class="slider"
                @change="onChange"
                @input="onInput"
              />
            </b-input-group>
          </b-card>
        </b-col>
      </b-row>
      <b-row>
        <b-col class="p-0">
          <b-card
            bg-variant="secondary"
            border-variant="secondary"
            text-variant="light"
            no-body
            class="p-1"
            style="max-height: 250px; min-width: 860px; border-radius: 0px;"
          >
            <b-card>
              <line-chart :chartData="summary" :height="50" style="max-height: 250px;"/>
            </b-card>
          </b-card>
        </b-col>
      </b-row>
      <b-row>
        <b-col
          class="p-0"
          cols="6"
          v-for="item in histograms"
          :key="item.name"
        >
          <b-card
            bg-variant="dark"
            border-variant="dark"
            text-variant="light"
            no-body
              style="border-radius: 0px;"
            v-if="item"
          >
            <b-card-text class="text-center m-0"> 속도별 차량분포 {{ item.name }} </b-card-text>
            <b-card no-body
              class="m-0 pt-0"
              text-variant="light"
              bg-variant="dark"
              border-variant="dark"
            >
              <histogram-chart :chartData="item" :height="115"/>
            </b-card>
          </b-card>
        </b-col>
      </b-row>
      <b-row>
        <b-col
          v-for="item in pies"
          :key="item.name"
          class="p-0" cols="6"
        >
          <b-card
            text-variant="light"
            bg-variant="secondary"
            border-variant=""
            style="border-radius: 0px;"
            >
            <doughnut :chartData="item" v-if="item.isReady" :height="135"/>
            <b-card-text class="text-center m-0"> 혼잡도 {{ item.name }} </b-card-text>
          </b-card>
        </b-col>
      </b-row>

    </b-container>

    <div class="top" v-if="!isReady">
      <div class="center">
        <h1><b-badge class="mb-2" variant="dark"> {{ msg }} </b-badge></h1>
      </div>
    </div>

  </div>
</template>
<script src="./simulation-comparison-result.js"></script>

<style scoped>

  .top {
    position: absolute;
    z-index:999;
    top: 200px;
    padding: 20px;
    width: 100%;
    opacity: 0.9;
  }
  .center {
    margin: 0 auto;
    text-align: center;
    /* border: 2px solid #73AD21; */
    width: 60%;
  }

</style>
