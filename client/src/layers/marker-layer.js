import * as maptalks from '../map/node_modules/maptalks';

const { VectorLayer } = maptalks;

export default () => new VectorLayer('markerLayer', [], {
  enableAltitude: true,
  // draw altitude
  drawAltitude: {
    lineWidth: 1,
    lineColor: '#000',
  },
});
