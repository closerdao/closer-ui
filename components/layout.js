import { Component } from 'react';
import { initAnalytics, trackPageView } from './analytics';

export default class Layout extends Component {
  componentDidMount() {
    if (!window.GA_INITIALIZED) {
      initAnalytics()
      window.GA_INITIALIZED = true
    }
    trackPageView()
  }

  render() {
    return this.props.children;
  }
}
