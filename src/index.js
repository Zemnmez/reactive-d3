import React from 'react'
import PropTypes from 'prop-types'
import ResizeObserver from 'resize-observer-polyfill';
import style from './index.module.css';
import 'intersection-observer';

const throttle = (f, time) => {
  let throttled = false;
  let next;

  const pause = new Promise((ok) => {
    throttled = true;
    setTimeout(() => ok(throttled = false), time);
  })

  const throttle = pause().then(() => {
    if (!next) return;

    // if there was an event to process, we process it
    // and throttle again
    f(...next);
    next = undefined;

    throttle();
  })

  return (...args) => {
    if(throttled) return next = args, undefined;

    f(...args);

    throttle();
  }
}

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
    this.intersectionObserver = new IntersectionObserver(([{ isIntersecting }]) => {
      if (isIntersecting == this.visible) return;
      this.visible = isIntersecting;

      if (this.visible) return this.componentDidBecomeVisible();
      this.componentDidBecomeInvisible();
    }).observe(container);
  }

  componentDidBecomeVisible() {
    const { container: { current: container } } = this;
    this.resizeObserver = new ResizeObserver( ([{ contentRect: { width, height } }]) =>
      this.setState({ width, height })).observe(container);
  }

  componentDidBecomeInvisible() {
    this.resizeObserver&&this.resizeObserver.disconnect();
  }

  componentWillUnmount() {
    this.componentDidBecomeInvisible()
  }

  render() {
    const { props: { join, children, render, className, ...etc }, container, main } = this;

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
