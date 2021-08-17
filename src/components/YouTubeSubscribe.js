import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class YouTubeSubscribe extends Component {
  /**
   *  React.createRef to attach script after mount
   *  Ref) https://reactjs.org/docs/refs-and-the-dom.html
   */

  constructor(props) {
    super(props);
    this.youtubeSubscribeNode = React.createRef();

    // To render components economically w/o repetition
    this.state = {
      initialized: false,
    };
  }

  initialized() {
    this.setState({
      initialized: true,
    });
  }

  /**
   * 1. Script for API doesn't work in index.html.
   * 2. So You have to make it after components render.
   * 3. Make a script with JavaScript method to work.
   * 4. It is a little slow to show component at first.
   * 5. YouTube API gives you channelId instead channelName
   *    So You don't have to think about channelName when you
   *    need its API.
   */

  componentDidMount() {
    if (this.state.initialized) {
      return;
    }

    const youtubescript = document.createElement('script');
    youtubescript.src = 'https://apis.google.com/js/platform.js';
    this.youtubeSubscribeNode.current.parentNode.appendChild(youtubescript);
    this.initialized();
  }

  render() {
    const { theme, layout, count, channelName, channelid } = this.props;

    return (
      <section className="youtubeSubscribe">
        <div
          ref={this.youtubeSubscribeNode}
          className="g-ytsubscribe"
          data-theme={theme}
          data-layout={layout}
          data-count={count}
          data-channel={channelName}
          data-channelid={channelid}
        />
      </section>
    );
  }
}

YouTubeSubscribe.propTypes = {
  channelName: PropTypes.string,
  channelid: PropTypes.string.isRequired,
  theme: PropTypes.string,
  layout: PropTypes.string,
  count: PropTypes.string,
};

YouTubeSubscribe.defaultProps = {
  channelName: '',
  theme: 'full',
  layout: 'default',
  count: 'default',
};
