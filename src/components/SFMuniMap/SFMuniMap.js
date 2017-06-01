// External modules
import React, { Component } from 'react';
import { geoPath as d3GeoPath, geoAlbers as d3GeoAlbers } from 'd3-geo';
import { select as d3Select } from 'd3-selection';
import { xml as d3Xml } from 'd3-request';
import { transition as d3Transition } from 'd3-transition';
import { easeLinear as d3EaseLinear } from 'd3-ease';
import moment from 'moment';

// Components
import RouteFilter from './RouteFilter/RouteFilter';

// Styles
import './SFMuniMap.css';

// Data
import neighborhoodsData from '../../data/sfmaps/neighborhoods.json';
import streetsData from '../../data/sfmaps/streets.json';

// Constants
const NEXTBUS_SF_MUNI_LOCATIONS_URL =
  '//webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=sf-muni';

class SFMuniMap extends Component {
  constructor() {
    super();
    this.state = {
      geoPath: null,
      vehicles: null,
      lastRefresh: 0,
      selectedRoutes: {},
      nextCall: null
    };
    this.onRouteFilterChange = this.onRouteFilterChange.bind(this);
  }

  componentDidMount() {
    // Get viewport width and height
    const width = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0
    );
    const height = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight || 0
    );

    // Create SVG elements
    const svg = d3Select('div.sf-muni-map')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');
    const neighborhoods = svg.append('g');
    const streets = svg.append('g');
    const vehicles = svg.append('g');

    // Define map projection
    const projection = d3GeoAlbers().fitSize(
      [width, height],
      neighborhoodsData
    );

    // Define path generator
    const geoPath = d3GeoPath().projection(projection).pointRadius(2);

    // Draw SF map
    neighborhoods
      .selectAll('path')
      .data(neighborhoodsData.features)
      .enter()
      .append('path')
      .attr('fill', '#ccc')
      .attr('d', geoPath);

    // Draw SF streets
    streets
      .selectAll('path')
      .data(streetsData.features)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('d', geoPath);

    // Save references to path generator and vehicles SVG group into state
    this.setState({
      geoPath,
      vehicles
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.vehicles !== this.state.vehicles ||
      prevState.lastRefresh !== this.state.lastRefresh ||
      prevState.selectedRoutes !== this.state.selectedRoutes
    ) {
      this.getSFMuniLocations();
    }
  }

  render() {
    return (
      <div className="sf-muni-map">
        <RouteFilter onChange={this.onRouteFilterChange} />
      </div>
    );
  }

  onRouteFilterChange(selectedRoutes) {
    this.setState({
      selectedRoutes
    });
  }

  getSFMuniLocations() {
    clearTimeout(this.state.nextCall);

    d3Xml(
      `${NEXTBUS_SF_MUNI_LOCATIONS_URL}&t=${this.state.lastRefresh}`,
      xml => {
        let locations = xml.getElementsByTagName('vehicle');
        locations = Array.from(locations);

        const hasSelectedRoutes = Object.values(
          this.state.selectedRoutes
        ).find(selected => {
          return selected === true;
        });

        // Filter vehicles based on selected routes if applicable
        if (hasSelectedRoutes) {
          locations = locations.filter(location => {
            return this.state.selectedRoutes[location.getAttribute('routeTag')];
          });
        }

        // Convert data returned by next-bus to GeoJSON features
        locations = locations.map(location => {
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [
                location.getAttribute('lon'),
                location.getAttribute('lat')
              ]
            },
            properties: { id: location.getAttribute('id') }
          };
        });

        // Transition to be used for moving vehicles
        const t = d3Transition().duration(750).ease(d3EaseLinear);

        // Select vehicles
        const vehicleSelection = this.state.vehicles
          .selectAll('path')
          .data(locations, v => v.properties.id);

        // Update existing vehicle locations
        vehicleSelection
          .attr('fill', 'red')
          .attr('stroke', 'white')
          .transition(t)
          .attr('d', this.state.geoPath);

        // Show new vehicles
        vehicleSelection
          .enter()
          .append('path')
          .attr('fill', 'red')
          .attr('stroke', 'white')
          .attr('d', this.state.geoPath);

        // Remove no longer existing vehicles
        vehicleSelection.exit().remove();

        // Draw again after 15 seconds
        const nextCall = setTimeout(() => {
          this.setState({
            lastRefresh: moment().unix()
          });
        }, 15000);

        // We save a reference to the next scheduled call to refresh vehicle locations to be able
        // to cancel that call if the selected routes change, because in that case we'll immediately
        // refresh vehicle locations and schedule a new call from that point
        this.setState({
          nextCall
        });
      }
    );
  }
}

export default SFMuniMap;
