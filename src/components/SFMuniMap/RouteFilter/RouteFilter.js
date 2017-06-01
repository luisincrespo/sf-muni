import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';

const NEXTBUS_SF_MUNI_ROUTES_URL =
  'http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=sf-muni';

class RouteFilter extends Component {
  constructor() {
    super();
    this.state = {
      routes: [],
      selected: {}
    };
  }

  componentDidMount() {
    d3.xml(NEXTBUS_SF_MUNI_ROUTES_URL, (xml) => {
      let routes = xml.getElementsByTagName('route');
      routes = Array.from(routes);

      routes = routes.map((route) => {
        return {
          tag: route.getAttribute('tag'),
          title: route.getAttribute('title')
        };
      });

      this.setState({
        routes
      });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selected !== this.state.selected) {
      this.props.onChange(this.state.selected);
    }
  }

  render() {
    return (
      <div className="sf-muni-route-filter">
        { this.state.routes.map((route) => {
            return (
              <div className="sf-muni-route-filter-option" key={route.tag}>
                <label htmlFor={route.tag}>{route.title}</label>
                <input
                  name={route.tag}
                  type="checkbox"
                  checked={this.state.selected[route.tag] || false}
                  onChange={this.onToggleRoute(route)}
                />
              </div>
            );
          })
        }
      </div>
    );
  }

  onToggleRoute(route) {
    return () => {
      this.setState({
        selected: Object.assign({}, this.state.selected, {
          [route.tag]: !this.state.selected[route.tag]
        })
      });
    };
  }
}

RouteFilter.propTypes = {
  onChange: PropTypes.func
};

RouteFilter.defaultProps = {
  onChange: () => null
};

export default RouteFilter;
