// External modules
import React, { Component } from 'react';

// Components
import SFMuniMap from '../SFMuniMap/SFMuniMap';

// Styles
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="sf-muni-app">
        <SFMuniMap />
      </div>
    );
  }
}

export default App;
