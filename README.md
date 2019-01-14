# reactive-d3

> reactive react bindings for d3

[![NPM](https://img.shields.io/npm/v/reactive-d3.svg)](https://www.npmjs.com/package/reactive-d3) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

D3 allows beautiful representations of data, but most D3 snippets do not componentize well as they are virtually always programmed with a hard-coded `width` and `height` value.

This small library exposes D3, a helper component which makes it easy to write D3 digrams that can be rendered into ReactDOM containers of any size and respond to changes.

## Install

```bash
yarn add reactive-d3
```

## Usage

More extensive examples can be found in the `examples/` directory, including a dynamically sized linegraph.

```jsx
import React, { Component } from 'react'

import D3 from 'reactive-d3';
import * as d3 from 'd3';

class SimpleCircles extends React.Component {
  join({main, width, height}) {
    // expect a [{color: "white", ratio: .5}] etc
    let {circles} = this.props;

    main = d3.select(main);
    main.attr("viewBox", `0 0 ${width} ${height}`);

    // draw the circles and bind the data
    circles = main.selectAll("circle").data(circles);

    // remove any circles that no longer exist
    circles.exit().remove();

    // add any circles that don't exist yet
    // and update the rest
    circles = circles.enter()
      .append("circle")
      .merge(circles)
      .attr("cx", width / 2)
      .attr("cy", height /2)
      .attr("r", ({ratio}) => width * ratio)
      .attr("fill", ({color}) => color);
  }

  render() {
    return <D3
        style={{width: "10vw", height: "10vh", ...this.props.style}}
        join={({...args}) => this.join(args)}>

      <svg />
    </D3>
  }
}
```

## License

MIT © [zemnmez](https://github.com/zemnmez)
