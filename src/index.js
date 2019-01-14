import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ResizeObserver from 'react-resize-observer';


export default class D3 extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {};
    this.main = React.createRef();
  }

  componentDidUpdate() {
    let {join} = this.props;
    let {width, height} = this.state;

    if (width !== undefined && height !== undefined) {
      new Promise((ok) => window.requestAnimationFrame(ok))
      .then(() => this.props.join({main: this.main.current, width, height}));
    }
  }

  componentDidMount() { this.componentDidUpdate() }

  childStyle() {
    return {
      gridArea: "content"
    }
  }

  style() {
    return {
      position: "relative",
      grid: '100%/100%'
    }
  }

  render() {
    let {join, children, render, style, className, ...etc} = this.props;
    return <div
      style={{...this.props.style, ...this.style()}}
      className={"d3 "+ (className || "")} {...etc}>

      <ResizeObserver
      onResize={({width, height})=>this.setState({width, height})} />

      {React.cloneElement(
        React.Children.only(children),
        {ref: this.main }
      )}
  </div>


  }
}
