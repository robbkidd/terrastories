import React, { Component } from 'react';
import Map from './Map';
import Card from './Card';
import IntroPopup from './IntroPopup';


class App extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <Map />
        <Card stories={this.props.stories}/>
        <IntroPopup />
      </div>
    );
  }
}
export default App;