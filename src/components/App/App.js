import React, { Component } from 'react';
import SFMuniMap from '../SFMuniMap/SFMuniMap';
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
