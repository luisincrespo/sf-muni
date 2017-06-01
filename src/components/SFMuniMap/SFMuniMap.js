import React, { Component } from 'react';
import * as d3 from 'd3';
import moment from 'moment';
import RouteFilter from './RouteFilter/RouteFilter';
import './SFMuniMap.css';
import neighborhoodsData from '../../data/sfmaps/neighborhoods.json';
import streetsData from '../../data/sfmaps/streets.json';

const NEXTBUS_SF_MUNI_LOCATIONS_URL =
  'http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=sf-muni'

class SFMuniMap extends Component {
  constructor() {
    super();
    this.state = {
      geoPath: null,
      vehicles: null,
      lastRefresh: 0,
      routeFilter: null
    };
    this.onRouteFilterChange = this.onRouteFilterChange.bind(this);
  }

  componentDidMount() {
    // Get viewport width and height
    const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    // Create SVG elements
    const svg = d3.select('div.sf-muni-map')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');
    const neighborhoods = svg.append('g');
    const streets = svg.append('g');
    const vehicles = svg.append('g');

    // Define map projection
    const projection = d3.geoAlbers()
      .fitSize([width, height], neighborhoodsData);;

    // Define path generator
    const geoPath = d3.geoPath()
      .projection(projection)
      .pointRadius(2);

    // Draw SF map
    neighborhoods.selectAll('path')
      .data(neighborhoodsData.features)
      .enter()
      .append('path')
      .attr('fill', '#ccc')
      .attr('d', geoPath);

    // Draw SF streets
    streets.selectAll('path')
      .data(streetsData.features)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('d', geoPath);

    this.setState({
      geoPath,
      vehicles
    });

    // Periodically draw SF muni vehicle locations
    this.getSFMuniLocations();
  }

  render() {
    return (
      <div className="sf-muni-map">
        <RouteFilter onChange={this.onRouteFilterChange} />
      </div>
    )
  }

  onRouteFilterChange(filter) {
    this.setState({
      routeFilter: filter
    });
    this.getSFMuniLocations()
  }

  getSFMuniLocations() {
    const that = this;
    d3.xml(`${NEXTBUS_SF_MUNI_LOCATIONS_URL}&t=${this.state.lastRefresh}`, (xml) => {
      let locations = xml.getElementsByTagName('vehicle');
      locations = Array.from(locations);

      locations = locations.map((location) => {
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [location.getAttribute('lon'), location.getAttribute('lat')]
          },
          properties: {id: location.getAttribute('id')}
        };
      });

      // Transition to be used for moving vehicles
      const t = d3.transition()
        .duration(750)
        .ease(d3.easeLinear);

      // Select vehicles
      const vehicleSelection = that.state.vehicles.selectAll('path')
        .data(locations, (v) => v.properties.id);

      // Update existing vehicle locations
      vehicleSelection
        .attr('fill', 'blue')
        .attr('stroke', '#999')
        .transition(t)
        .attr('d', that.state.geoPath);

      // Show new vehicles
      vehicleSelection
        .enter()
        .append('path')
        .attr('fill', 'blue')
        .attr('stroke', '#999')
        .attr('d', that.state.geoPath);

      // Remove no longer existing vehicles
      vehicleSelection
        .exit()
        .remove();

      that.setState({
        lastRefresh: moment().unix()
      });

      // Draw again after 15 seconds
      setTimeout(() => {
        that.getSFMuniLocations();
      }, 15000);
    });
  }
}

export default SFMuniMap;
