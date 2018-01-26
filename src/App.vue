<template>
  <div id="app">
    <label>Width:</label>
    <input type="number" v-model="width" min="100" style="width:50px" placeholder="width of drawing">
    <label>Height:</label>
    <input type="number" v-model="height" min="100" style="width:50px" placeholder="height of drawing">
    <label>Periods:</label>
    <input type="number" v-model="periodCount" min="1" style="width:50px" placeholder="# of periods">
    <label>Period Index:</label>
    <input type="number" v-model="periodIndex" min="0" style="width:50px" placeholder="index of current period">
    <label>Wheel Label:</label>
    <input v-model="wheelLabel" style="width:50px" placeholder="">
    <label>Wheel Label:</label>
    <input v-model="wheelLabel2" style="width:50px" placeholder="">
    <label>Period Label 2:</label>
    <input v-model="periodLabel" style="width:50px" placeholder="name of a period">
    <label>Strategies (json):</label>
    <textarea v-model="strategies" rows="2" style="width:500px" placeholder="json"></textarea>
    <button v-on:click="start">Start</button>
    <div id="diagramView"></div>
  </div>
</template>

<script>

function createDiagram(config) {
  function moveCenter(shape) {
    shape.move({ x: -shape.width()/2, y: -shape.height()/2 });
  }
  // function degreesFromRadians(radians) {
  //   return radians/Math.PI*180;
  // }
  function createWheel() {
    const group = new Konva.Group();
    group.add(new Konva.Circle({
      x: wheelCenter.x,
      y: wheelCenter.y,
      radius: wheelRadius,
      fill: '#89b717',
      opacity: 0.8,
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffset: { x : 5, y : 5 },
      shadowOpacity: 0.6,
    }));
    return group;
  }
  function pointFromCenter(angle, distanceFromCenter) {
    const xoffset = distanceFromCenter * Math.cos(angle);
    const yoffset = distanceFromCenter * Math.sin(angle);
    return {x: wheelCenter.x + xoffset, y: wheelCenter.y + yoffset};
  }
  function segmentPointFromCenter(segment, distanceFromCenter) {
    const angle = fullCycle * (segment / segmentCount) + quarterCycle;
    return pointFromCenter(angle, distanceFromCenter);
    // const xoffset = distanceFromCenter * Math.cos(angle);
    // const yoffset = distanceFromCenter * Math.sin(angle);
    // return {x: wheelCenter.x + xoffset, y: wheelCenter.y + yoffset};
  }
  function segmentEdgeOnPerimeter(segment) {
    return segmentPointFromCenter(segment, wheelRadius);
  }
  function createPeriodMarker(segment) {
      const position = segmentEdgeOnPerimeter(segment);
      const group = new Konva.Group();
      group.add(new Konva.Circle({
        x: position.x,
        y: position.y,
        radius: 7,
        fill: 'black',
        opacity: 0.8,
      }));
      const text = new Konva.Text({
        x: position.x,
        y: position.y,
        text: segment,
        fontSize: 10,
        fontFamily: 'Calibri',
        fill: 'white',        
      });
      moveCenter(text);
      group.add(text);
      return group;
  }
  /**
   * Create period markers around the wheel perimeter spaced equally -- excluding
   * the double, bottom slice.
   */
  function createPeriodMarkers() {
    const group = new Konva.Group();

    const degreesPerSegment = 360/segmentCount;
    group.add(new Konva.Arc({
      x: wheelCenter.x,
      y: wheelCenter.y,
      //innerRadius: 0,
      outerRadius: wheelRadius,
      rotation: (segmentCount-1) * degreesPerSegment + 90,
      angle: 2 * degreesPerSegment,
      fill: 'gray',
      //stroke: 'black',
      //strokeWidth: 0,
      // opacity: 0.8,
      // shadowColor: 'black',
      // shadowBlur: 10,
      // shadowOffset: { x : 5, y : 5 },
      // shadowOpacity: 0.6,
    }));

    for (let segment = 1; segment < segmentCount; ++segment) {
      group.add(createPeriodMarker(segment));
    }

    const point = pointFromCenter(Math.PI*.75, wheelRadius*1.25);
    const text = new Konva.Text({
      x: point.x,
      y: point.y,
      text: config.periodLabel,
      fontSize: 14,
      fontFamily: 'Calibri',
    });
    moveCenter(text);
    group.add(text);
    
    const wheelText = new Konva.Text({
      x: wheelCenter.x,
      y: wheelCenter.y - wheelRadius*2/3,
      text: config.wheelLabel,
      fontSize: 18,
      fontFamily: 'Calibri',
    });
    moveCenter(wheelText);
    group.add(wheelText);
    const wheelText2 = new Konva.Text({
      x: wheelCenter.x - wheelRadius/2,
      y: wheelCenter.y,
      text: config.wheelLabel2,
      fontSize: 18,
      fontFamily: 'Calibri',
    });
    moveCenter(wheelText2);
    group.add(wheelText2);

    return group;
  }
  function createStratagyRadialLines() {
    const shapes = [];
    strategies.forEach((s,i) => {
      const endPoint = segmentPointFromCenter(segmentIndex + .5, wheelRadius + strategyRadius*2*i + strategyRadius);
      shapes.push(new Konva.Line({
          points: [
            wheelCenter.x, wheelCenter.y, 
            endPoint.x, endPoint.y
          ],
          stroke: 'red',
          strokeWidth: 2,
          lineCap: 'round',
          lineJoin: 'round'
      }));
    });
    return shapes;
  }
  function createStratagyShapes() {
    const shapes = [];
    strategies.forEach((strategy, i) => {
      const center = segmentPointFromCenter(segmentIndex + .5, wheelRadius + strategyRadius + strategyRadius*2*i);
      const group = new Konva.Group({
        x: center.x,
        y: center.y,
      });
      group.on('click', startStrategySelect);
      group.add(new Konva.Circle({
        radius: strategyRadius,
        fill: strategyConfigs[i].color,
        opacity: 0.8,
        shadowColor: 'black',
        shadowBlur: 10,
        shadowOffset: { x : 5, y : 5 },
        shadowOpacity: 0.6,
      }));const text = new Konva.Text({
        text: strategy.name,
        fontSize: 12,
        fontFamily: 'Calibri',
        //fill: 'black',
      });
      moveCenter(text);
      group.add(text);
      shapes.push(group);
    });
    return shapes;
  }
  function createInnerCircle() {
    return new Konva.Circle({
      x: wheelCenter.x,
      y: wheelCenter.y,
      radius: wheelRadius/2,
      fill: 'red',
      opacity: 0.4,
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffset: { x : 5, y : 5 },
      shadowOpacity: 0.6,
      visible: false
    });
  }
  function startStrategySelect() {
    //isSelectingStrategy = true;
    innerCircle.show();
    instructionsText.show();
    periodMarkersGroup.hide();
    strategyShapes.forEach(d => d.draggable(true));
    strategyShapes.forEach(d => d.off('click'));
    strategies.forEach((s,i) => {
      const angle = strategyConfigs[i].angle;
      const endPoint = pointFromCenter(angle, wheelRadius + strategyRadius);
      const points = [
        wheelCenter.x, wheelCenter.y, 
        endPoint.x, endPoint.y
      ];
      strategyShapes[i].startPosition = endPoint;
      strategyShapes[i].strategy = s;
      strategyShapes[i].position(endPoint);
      strategyRadialLines[i].points(points);

      const angle2 = strategyConfigs[i].angle - Math.PI/8;
      const endPoint2 = pointFromCenter(angle2, wheelRadius*2/3);
      const text = new Konva.Text({
        x: endPoint2.x,
        y: endPoint2.y,
        text: s.confidence,
      });
      moveCenter(text);
      layer.add(text);

      const angle3 = strategyConfigs[i].angle + Math.PI/8;
      const endPoint3 = pointFromCenter(angle3, wheelRadius*2/3);
      const text3 = new Konva.Text({
        x: endPoint3.x,
        y: endPoint3.y,
        text: s.upside,
      });
      moveCenter(text3);
      layer.add(text3);
    });

    layer.draw();
  }

  //NOTE: supports up to 4 strategies ... fails if more
  const strategyConfigs = [
    { angle: Math.PI*1.25, color: 'Aqua' }, 
    { angle: Math.PI*1.75, color: 'Chartreuse ' }, 
    { angle: Math.PI*.25, color: 'DarkGoldenRod ' }, 
    { angle: Math.PI*.75, color: 'DarkOrchid' }
  ];

const stage = new Konva.Stage({
    container: 'diagramView',
    width: config.width,
    height: config.height
  });
  const wheelRadius = Math.min(stage.getWidth(), stage.getHeight()) / 2 * .7;
  const wheelCenter = { x: stage.getWidth()/2, y: stage.getHeight()/2};
  const strategyRadius = wheelRadius / 7;
  const fullCycle = 2 * Math.PI;
  const quarterCycle = Math.PI / 2;
  const segmentCount = parseInt(config.periodCount) + 2;
  const segmentIndex = parseInt(config.periodIndex) + 1;
  const strategies = JSON.parse('[' + config.strategies + ']');
  //let isSelectingStrategy = false;
  const layer = new Konva.Layer();
  const dragLayer = new Konva.Layer();
  const wheelShape = createWheel();
  const strategyShapes = createStratagyShapes();
  const strategyRadialLines = createStratagyRadialLines();
  const innerCircle = createInnerCircle();
  const periodMarkersGroup = createPeriodMarkers();

  layer.add(wheelShape);

  const instructionsText = new Konva.Text({
    x: wheelCenter.x,
    y: wheelCenter.y - wheelRadius*1.25,
    text: 'Drag strategy to inner circle to select',
    visible: false
  });
  moveCenter(instructionsText);
  layer.add(instructionsText);

  Konva.Layer.prototype.add.apply(layer, strategyRadialLines);
  layer.add(periodMarkersGroup);
  layer.add(innerCircle);
  strategyShapes.forEach(d => layer.add(d));

  // [1,segmentCount-1].forEach(segment => {
  //   const pt = segmentEdgeOnPerimeter(segment);
  //   layer.add(new Konva.Line({
  //       points: [
  //         wheelCenter.x, wheelCenter.y, 
  //         pt.x, pt.y
  //       ],
  //       stroke: 'red',
  //       strokeWidth: 1,
  //       lineCap: 'round',
  //       lineJoin: 'round'
  //   }));
  // });

  stage.add(layer, dragLayer);

  stage.on('dragstart', function(evt) {
    const shape = evt.target;
    // moving to another layer will improve dragging performance
    shape.moveTo(dragLayer);
    stage.draw();
    
    // if (tween) {
    //   tween.pause();
    // }
    shape.setAttrs({
      shadowOffset: {
        x: 15,
        y: 15
      },
      scale: {
        x: 1.2,
        y: 1.2
      }
    });
  });

  function cursorOverShape(shape) {
    const shapes = stage.getAllIntersections(stage.getPointerPosition());
    if (shapes.includes(shape)) {
      return true;
    }
  }

  stage.on('dragend', function(evt) {
    const shape = evt.target;
    shape.moveTo(layer);
    if (cursorOverShape(innerCircle)) {
      instructionsText.text('you picked: ' + shape.strategy.name);
    } else {
      shape.position(shape.startPosition);
    }
    stage.draw();
    shape.to({
      duration: 0.5,
      easing: Konva.Easings.ElasticEaseOut,
      scaleX: 1,
      scaleY: 1,
      shadowOffsetX: 5,
      shadowOffsetY: 5
    });
  });

  stage.on('dragmove', function(evt) {
    if (cursorOverShape(innerCircle)) {
      innerCircle.fill('blue');
      stage.draw();
    } else {
      innerCircle.fill('red');
      stage.draw();
    }
  });
}

const config = {
    width: 400,
    height: 400,
    periodCount: 12,
    periodIndex: 4,
    periodLabel: 'Week',
    strategies: 
`{"name":"C", "confidence": "69%", "upside": "$3k" },
{"name":"S", "confidence": "54%", "upside": "$8.5k" }`,
    wheelLabel: 'Corn',
    wheelLabel2: '123'
};

export default {
  name: 'app',
  data () {
    return config;
  },
  methods: {
    start() {
      createDiagram(config);
    }
  },
  directives: {
    updateMessage(canvasElement, binding) {
        const ctx = canvasElement.getContext("2d");
        ctx.clearRect(0, 0, 300, 150);
        ctx.fillStyle = "black";
        ctx.font = "20px Georgia";
        ctx.fillText(binding.value, 10, 50);
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /* margin-top: 60px; */
}

h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
