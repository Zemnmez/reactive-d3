import React from 'react'
import PropTypes from 'prop-types'
import ResizeObserver from 'resize-observer-polyfill';
import style from './index.module.css';

export default class D3 extends React.PureComponent {
  constructor(props) {
    super(props);

    const [main, container] = [React.createRef(), React.createRef()];
	const state = {};

    Object.assign(this, {main, container, state});
  }

  componentDidUpdate() {
    const { main: { current: main }, props: { join }, state: { width, height } } = this;
    if (width !== undefined && height !== undefined) {
      new Promise((ok) => window.requestAnimationFrame(ok))
      .then(() => join({main, width, height}));
    }
  }

  componentDidMount() {
    const { container: { current: container } } = this;

    this.observer = new ResizeObserver( ([{ contentRect: { width, height } }]) =>
      this.setState({ width, height })).observe(container);
  }

  componentWillUnmount() {
    this.observer&&this.observer.disconnect();
  }

  render() {
    const { props: { join, children, render, className, ...etc }, container, main } = this;

    console.log(this.state.width, this.state.height);

    // would return the svg but turns out svgs arent observable
    // https://github.com/WICG/ResizeObserver/issues/9
    return <div {...{
	  ref: container,
	  className: [style.d3].concat(className).join(" "),
	  ...etc
    }}>

      {React.cloneElement(
        React.Children.only(children),
        { ref: main }
      )}

    </div>
  }
}

console.log(style);
