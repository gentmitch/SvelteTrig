<script>
  import { onMount, afterUpdate, tick } from 'svelte';
  import Modal from './lib/Modal.svelte';
  // @ts-ignore
  import InputLabel from './lib/InputLabel.svelte';

  let canvas;
  let ctx;
  const height = 500;
  const width = 500;

  let RED = '#db2c1d';
  let BLUE = '#1528d1';
  let GREEN = '#22d115';

  const yCenter = Number.parseFloat(height / 2);
  const xCenter = Number.parseFloat(width / 2);
  let radius = 150.0;
  let degrees = 0;
  const startingPoint = { x: xCenter, y: yCenter };
  let angle = 0;
  let speed = 1.0;
  let numDots = 9;
  let points = [];

  const toggles = {
    showYLine: false,
    showXLine: false,
    showBiLine: false,
    showXYLine: false,
    showYAxis: false,
    showXAxis: false,
    showCircle: false,
    showRedDot: false,
    explainer: false,
  };

  $: angleSpeed = speed / 100;
  $: x = startingPoint.x + Math.cos(angle) * radius;
  $: y = startingPoint.y + Math.sin(angle) * radius;

  $: verticalLine = {
    begin: { x: xCenter, y: xCenter - radius },
    end: { x: yCenter, y: yCenter + radius },
  };

  $: horizontalLine = {
    begin: { x: xCenter - radius, y: yCenter },
    end: { x: xCenter + radius, y: yCenter },
  };

  $: betweenXY = {
    begin: { x: x, y: yCenter },
    end: { x: xCenter, y: y },
  };

  $: bisectingLine = {
    begin: { x: xCenter, y: yCenter },
    end: { x: x, y: y },
  };

  $: xLine = {
    begin: { x: x, y: xCenter },
    end: { x: x, y: y },
  };

  $: yLine = {
    begin: { x: xCenter, y: y },
    end: { x: x, y: y },
  };

  onMount(() => {
    ctx = canvas.getContext('2d');
    for (var i = 1; i <= numDots; i++) {
      let [dotx, doty] = calcPoint(i, numDots);
      points.push({ startx: dotx, starty: doty });
    }
    window.requestAnimationFrame(draw);
  });

  function calcPoint(currentPoint, totalPoints) {
    var theta = (Math.PI * 2) / totalPoints;
    var a = theta * currentPoint;

    let dotx = radius * Math.cos(a + currentPoint) + startingPoint.x;
    let doty = radius * Math.sin(a + currentPoint) + startingPoint.y;

    return [dotx, doty];
  }

  afterUpdate(async () => {
    await tick();
  });

  // function calcPoint(currentPoint, totalPoints) {
  //   var theta = (Math.PI * 2) / totalPoints;
  //   var a = theta * currentPoint;

  //   let dotx = radius * Math.cos(a + currentPoint) + startingPoint.x;
  //   let doty = radius * Math.sin(a + currentPoint) + startingPoint.y;

  //   return [dotx, doty];
  // }

  function drawDot(x, y, color = '#000') {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.closePath();
    ctx.fill();
  }

  function drawCircle() {
    ctx.beginPath();
    ctx.arc(xCenter, yCenter, radius, 0, 2 * Math.PI);
    ctx.stroke();
  }

  function drawLine({ begin, end }) {
    //Vertical line
    ctx.beginPath();
    ctx.moveTo(begin.x, begin.y);
    ctx.lineTo(end.x, end.y);
    ctx.closePath();
    ctx.stroke();
  }

  function drawLines() {
    if (toggles.showXYLine) drawLine(betweenXY);
    if (toggles.showYAxis) drawLine(verticalLine);
    if (toggles.showXAxis) drawLine(horizontalLine);
    if (toggles.showBiLine) drawLine(bisectingLine);
    if (toggles.showXLine) drawLine(xLine);
    if (toggles.showYLine) drawLine(yLine);
  }

  function draw() {
    degrees = 360 / (2 * Math.PI * radius);
    angle = angle < -6.3 ? (angle = 0) : angle - angleSpeed;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (toggles.showCircle) drawCircle();
    if (toggles.showRedDot) drawDot(x, y, RED);

    drawDot(x, 250, BLUE);
    drawDot(250, y, GREEN);
    drawLines();

    window.requestAnimationFrame(draw);
  }
</script>

<div id="main">
  <div id="canvas">
    <canvas bind:this={canvas} {height} {width} />
    {#if toggles.explainer}
      <Modal />
    {/if}
  </div>

  <div id="controls">

    <InputLabel
      name="radius"
      labelText="Radius"
      max={200}
      min={50}
      type="range"
      step={0.1}
      bind:value={radius}
    />
    
    <div id="toggles">
      <InputLabel
      name="xyLine"
      bind:checked={toggles.showXYLine}
      labelText="Hypotenuse"
      type="checkbox"
      />
      <InputLabel
        name="circle"
        bind:checked={toggles.showRedDot}
        labelText="Point"
        type="checkbox"
      />
      <InputLabel
        name="xAxis"
        bind:checked={toggles.showXAxis}
        labelText="X Axis"
        type="checkbox"
      />
      <InputLabel
        name="yAxis"
        bind:checked={toggles.showYAxis}
        labelText="Y Axis"
        type="checkbox"
      />
      <InputLabel
        name="circle"
        bind:checked={toggles.showCircle}
        labelText="Circle"
        type="checkbox"
      />
      <InputLabel
        name="yLine"
        bind:checked={toggles.showYLine}
        labelText="Cosine Mapping"
        type="checkbox"
      />

      <InputLabel
        name="xLine"
        bind:checked={toggles.showXLine}
        labelText="Sine Mapping"
        type="checkbox"
      />
      <InputLabel
        name="biLine"
        bind:checked={toggles.showBiLine}
        labelText="Bisecting line"
        type="checkbox"
      />
    </div>
    <!-- <button onclick="">Save</button> -->
  </div>
</div>

<style>
  canvas {
    border: 1px solid black;
  }
  .container {
    display: flex;
    flex-direction: row;
    align-items: baseline;
  }
  h3 {
    margin-bottom: 5px;
  }
  /* h2 {
    margin-right: 10px;
  } */
  #main {
    display: grid;
    grid-auto-flow: column;
    column-gap: 100px;
  }
  #toggles {
    display: grid;
    grid-template-rows: max-content;
  }
</style>
