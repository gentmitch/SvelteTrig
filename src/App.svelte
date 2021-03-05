<script>
	import { onMount, afterUpdate, tick } from 'svelte';
	import Modal from './Modal.svelte'
	let canvas;
	let ctx;
	const height = 500;
	const width = 500;
	
	let RED = "#db2c1d";
	let BLUE = "#1528d1";
	let GREEN = "#22d115";
	
	const yCenter = Number.parseFloat(height / 2);
	const xCenter =  Number.parseFloat(width / 2);
	let radius = 150.0;
	let degrees = 0;
	const startingPoint = {x: xCenter, y: yCenter};
	let angle = 0;
	let speed = 1.0;
	let numDots = 9
	let points = [];
	
	let showYLine = false;
	let showXLine = false;
	let showBiLine = false;
	let showXYLine = false;
	let showYAxis = false;
	let showXAxis = false;
	let showCircle = false;
	let showRedDot = false;
	let explainer = false;
	
	$: angleSpeed = speed/100
	$: x = startingPoint.x + Math.cos(angle) * radius
	$: y = startingPoint.y + Math.sin(angle) * radius
	
	$: verticalLine = {
		begin:{x:xCenter, y:xCenter - radius},
		end: {x: yCenter, y:yCenter + radius}
	}
	
	$: horizontalLine = {
		begin:{x: xCenter - radius, y:yCenter},
		end: {x: xCenter + radius, y:yCenter}
	}
	
	$: betweenXY = {
		begin:{x: x, y: yCenter},
		end: {x: xCenter, y:y}
	}
	
	$: bisectingLine = {
		begin:{x: xCenter, y: yCenter},
		end: {x: x, y:y}
	}
	
	$: xLine = {
		begin:{x: x, y: xCenter},
		end: {x: x, y:y}
	}
	
	$: yLine = {
		begin:{x: xCenter, y: y},
		end: {x: x, y:y}
	}
	
	
	onMount(()=>{
		ctx = canvas.getContext('2d')	
// 		for (var i = 1; i <= numDots; i++) {
// 			let [dotx,doty] = calcPoint(i, numDots);
// 			points.push({startx: dotx, starty: doty})
// 		}
		window.requestAnimationFrame(draw);
	})
	
	afterUpdate(async ()=>{
		await tick();
	})
	
	function calcPoint(currentPoint, totalPoints) {  
			var theta = ((Math.PI*2) / totalPoints);
			var a = (theta * currentPoint);
			
			let dotx = ((radius * Math.cos(a + currentPoint)) + startingPoint.x);
			let doty = (radius * Math.sin(a + currentPoint)) + startingPoint.y;
		
			return [dotx, doty];
	}
	
	function drawDot(x, y, color = "#000") {
		ctx.beginPath()
		ctx.arc(x,y, 5, 0, 2 * Math.PI);
		ctx.fillStyle = color;
		ctx.closePath();
		ctx.fill()
	}
	
	function drawCircle() {	
		ctx.beginPath();
		ctx.arc(xCenter, yCenter, radius, 0, 2 * Math.PI);
		ctx.stroke();
	}
	
	function drawLine({begin, end}) {
		//Vertical line
		ctx.beginPath()
		ctx.moveTo(begin.x, begin.y)
		ctx.lineTo(end.x, end.y);
		ctx.closePath();
		ctx.stroke()
	}
	
	function drawLines() {
		if(showXYLine) drawLine(betweenXY)
		if(showYAxis) drawLine(verticalLine)
		if(showXAxis) drawLine(horizontalLine)
		if(showBiLine) drawLine(bisectingLine)
		if(showXLine) drawLine(xLine)
		if(showYLine) drawLine(yLine);
	}
	
	function draw() {
		degrees = (360)/ (2 * Math.PI * radius)
		
		angle = (angle < -6.3) ? angle = 0: (angle - angleSpeed); 
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		if(showCircle) drawCircle()
		// X, Y
		if(showRedDot) drawDot(x, y, RED)
		// X mapping
		drawDot(x, 250, BLUE)
		// Y mapping
		drawDot(250, y, GREEN)
		
// 		points.forEach((point)=>{
// 			calcPoint(point)
// 			drawDot(point.startx, point.starty)
// 		})
		
		drawLines()
		
		window.requestAnimationFrame(draw);
	}
		
	
</script>

<div>
	<canvas bind:this={canvas} height={height} width={width}></canvas>
	{#if explainer}
		<Modal/>	
	{/if}
</div>
<form>
	<div class="container">
		<h2>Please explain: </h2>
		<input bind:checked={explainer} type="checkbox" name="explainer">			
	</div>

	<label for="speed">Speed</label>
  <input bind:value={speed} type="range" min=".1" max="10" name="speed" step=".1" >

	<label for="radius">Radius</label>
  <input bind:value={radius} type="range" min="10" max={yCenter} name="radius" step=".1">
<!-- 	
	<label for="numberDots">Number of dots</label>
  <input bind:value={numDots} type="range" min="1" max={20} name="numberDots" step=".1">
	 -->
	<h3>
		Start here 
	</h3>
	<div class="container">
		<label for="xAxis">X Axis</label>
		<input bind:checked={showXAxis} type="checkbox" name="xAxis">

		<label for="yAxis">Y Axis</label>
		<input bind:checked={showYAxis} type="checkbox" name="yAxis">
	</div>
	
	<h3>
		Little more context
	</h3>
	<div class="container">
		<label for="circle">Show circle</label>
		<input bind:checked={showCircle} type="checkbox" name="circle">

		<label for="redDot">Show dot</label>
		<input bind:checked={showRedDot} type="checkbox" name="redDot">
	</div>
	
	<h3>
		A little more
	</h3>
	<div class="container">
		<label for="yLine">Y line</label>
		<input bind:checked={showYLine} type="checkbox" name="yLine">
		
		<label for="xLine">X line</label>
  	<input bind:checked={showXLine} type="checkbox" name="xLine">
		
		<label for="xyLine">XY connection line</label>
		<input bind:checked={showXYLine} type="checkbox" name="xyLine">
		
		<label for="biLine">Bisecting line</label>
		<input bind:checked={showBiLine} type="checkbox" name="biLine">

	</div>
</form>

<style >
	canvas {border: 1px solid black;}
	.container {display: flex; flex-direction: row; align-items: baseline}
	input {margin-right: 20px}
	label {margin-right: 8px}
	h3 {margin-bottom: 5px}
	h2 {margin-right: 10px}
</style>
