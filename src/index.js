import React from 'react'
import PropTypes from 'prop-types'
import ResizeObserver from 'resize-observer-polyfill';
import style from './index.module.css';
import 'intersection-observer';

const log = process.env.NODE_ENV == 'development'?
  (...args) => console.log(...args):
  () => void 0;

const assert = process.env.NODE_ENV == 'development'?
  (...args) => console.assert(...args):
  () => void 0;

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

const requestIdleCallback = window.requestIdleCallback || ((callback) => callback());

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
      .then(new Promise((ok) => requestIdleCallback(ok)))
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
    }, {
      threshold: [0, .1]
    }).observe(container);
  }

  componentDidBecomeVisible() {
    log("component now visible");
    const { container: { current: container } } = this;
    console.log("current resizeObserver", this.resizeObserver);
    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver( ([{ contentRect: { width, height } }]) =>
	this.setState({ width, height }));
      this.resizeObserver.observe(container);
      log("new resizeObserver", this.resizeObserver);
    }
  }

  componentDidBecomeInvisible() {
    log("component now invisible; removing resizeObserver");
    this.resizeObserver&&(this.resizeObserver = this.resizeObserver.disconnect());
    assert(this.resizeObserver == undefined);
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
