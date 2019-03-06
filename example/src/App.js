import React, { Component } from 'react'

import D3 from 'reactive-d3';
import * as d3 from 'd3';

class Graph extends React.PureComponent {
  constructor(props) {
  super(props);
   const {
      samples = 50,
      f = x => x**2,
      margin = {top: 20, right: 20, bottom: 30, left: 50}
    } = props;

    this.state = {
        samples,
        margin,
        f
    }

    this.state = {...this.state, ...Graph.generateData(this.state)}
  }

  static generateData({samples, f}) {
    let points = [...Array(samples)];

    points = points.map((_, x) => [x, f(x)]);

    // remove Infinite values that confuse d3
    points = points.filter(([x, y]) => ![x,y].some(k => Math.abs(k) == Infinity));

    // enhance to object
    points = points.map(([x, y]) => ({pt: [x,y]}));

    let lastPoint = points.slice(-1)[0];

    let areas =["low", "medium", "high"];

    // generate indicies that demarcate these areas
    areas = areas.map((caption, i) =>
      ({
        idx: Math.round(i*(points.length/3)),
        caption
      }));


    // map indicies to points
    areas = areas.map(({idx: i, ...etc}) => ({
      pt: points[i].pt,
      ...etc
    }));

    // make that an array of two values, start and end for the area
    areas = areas.map(({ pt: [x, y], ...etc }) => ({
      points: [[x, 0]],
      ...etc
    }));


    // set our end point to the previous point's start
    areas = areas.map(({ points: [start], ...etc }, i, a) => {
      let next = a[i+1];

      let end = next?next.points[0]: [lastPoint.pt[0], 0];

      return ({
          // if there is no next point, use the last point
          points: [start, (a[i+1] || {points: false}).points[0] || [lastPoint.pt[0], 0]],
          ...etc
        });
    });

    return ({points, areas});
  }

  join({main, width, height}) {
    console.log("draw!")
    let {margin = this.defaultMargin, areas, points} = this.state;

    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;

    const container = d3.select(main);

    let scale = {
      x: d3.scaleLinear().range([0, graphWidth]),
      y: d3.scaleLinear().range([graphHeight, 0])
    };

    let lines = []

    lines.push({
      data: {areas, points},
      line: d3.line()
        .x(({ pt: [x, y] }) => scale.x(x))
        .y(({ pt: [x, y] }) => scale.y(y))
        .curve(d3.curveBasis)
    });


    areas = areas.map(({ caption, points: [start, end] }) => {
        [start, end] = [start, end].map(([x, y]) => ({x,y}));

        return ({
          caption,
          area: d3.area()
            .curve(d3.curveBasis)
            .x1(({ pt: [x, y] }) => scale.x(x))
            .y1(({ pt: [x, y] }) => scale.y(y))
            .x0(({ pt: [x, y] }) => scale.x(x))
            .y0(({ pt: [x, y] }) => scale.y(0.008))
            .defined(({pt: [x, y]}) => {
              if (start.x) if (x < start.x) return false;
              if (start.y) if (x < start.y) return false;
              if (end.x) if (x > end.x) return false;
              if (end.y) if (y > end.y) return false;
              return true;
            }),

          points: [start, end]
      })
    })

    container.attr("viewBox", `0 0 ${width} ${height}`);

    let offsetEl = container.select(".offset-el");

    offsetEl.attr("transform", `translate(${margin.left},${margin.top})`);

    // scale data
    [scale.x, scale.y].forEach((scale, i) => scale.domain(
      d3.extent(points, ({ pt }) => pt[i])
    ));

    lines = offsetEl.selectAll(".line").data(lines);

    lines.exit().remove();

    lines = lines.enter()
      .append("path")
      .attr("class", "line")
      .merge(lines)
      .attr("d", ({line, data}) => line(data.points));

    areas = offsetEl.selectAll(".area").data(areas);

    areas.exit().remove();

    areas = areas.enter()
      .append("path")
      .attr("class", (_, i) => `area n${i}`)
      .merge(areas)
      .attr("id", (d, i) => `area-${i}`)
      .attr("d", ({area}) => area(points));

    let areaCaptions = offsetEl.selectAll(".area-caption").data(areas.data())


    areaCaptions.exit().remove();


    areaCaptions = areaCaptions.enter()
      .append("text")
      .attr("class", "area-caption")
      .attr("dy", "-10")
      .merge(areaCaptions)
      .each(({caption}, i, nodes) => {
        let parent = d3.select(nodes[i]);

        let textPath = parent.selectAll("textPath").data([caption]);

        textPath = textPath.enter()
          .append("textPath")
          .merge(textPath)
          .text(d => d)
          .attr("xlink:href", `#area-${i}`);
      });

    let axes = offsetEl.selectAll(".axis").data(Object.entries(scale));

    axes.exit().remove();

    axes = axes.enter()
      .append("g")
      .merge(axes)
      .attr("class", ([axis, scale]) => `${axis} axis`)
      .attr("transform", ([axis]) => `translate(0,${axis=="x"?graphHeight:0})`)
      .each(([axis, scale], i, n) => d3.select(n[i])
        .call(({x:d3.axisBottom, y:d3.axisLeft})[axis](scale)));
  }


  render() {
    return <D3 className="graph" join={({...args}) => this.join(args)}>
      <svg>
       <defs>
          <pattern id="dots" patternUnits="userSpaceOnUse" width="10" height="10">
            <circle cx="1" cy="1" r="1" />
          </pattern>
          <pattern id="stripes" patternUnits="userSpaceOnUse" width="10" height="10">
           <path d='M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2' stroke='black' strokeWidth='1'/>
          </pattern>
        </defs>

        <g className="offset-el" />
      </svg>
    </D3>
  }
}

class SimpleCircles extends Component {
  join({main, width, height}) {
    // expect a [{color: "white", ratio: .5}] etc
    let {circles} = this.props;

    main = d3.select(main);
    main.attr("viewBox", `0 0 ${width} ${height}`);

    // draw the circles and bind the data
    circles = main.selectAll("circle").data(circles);

    // remove any circles that no longer exist
    circles.exit().remove();

	console.log(width, height);

    // add any circles that don't exist yet
    // and update the rest
    circles = circles.enter()
      .append("circle")
      .merge(circles)
      .attr("cx", width / 2)
      .attr("cy", height /2)
      .attr("r", ({ratio}) => Math.min(width, height) * ratio)
      .attr("fill", ({color}) => color);
  }

  render() {
	const { props: { style } } = this;
    return <D3 {...{style}} join={({...args}) => this.join(args)}>
      <svg />
    </D3>
  }
}

export default () => <div>
  <Graph/>
  <SimpleCircles style={{width: "10vw", height: "10vh"}} circles={[
    {color: "red", ratio: .5},
    {color: "green", ratio: 0.1}
  ]}/>
</div>;
