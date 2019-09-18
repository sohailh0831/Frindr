import React, { Component } from 'react';
import './App.css';

import { BrowserRouter as Router, Switch } from "react-router-dom";
import Route from "react-router-dom/Route";

import Home from "./pages/Home";
import Login from "./pages/Login";

class App extends Component {
  render() {
    return (
      <div>
        <Router>
          <Switch>
            <Route
              exact path="/"
              render={props => <Home />}
            />
            <Route
              exact path="/login"
              render={props => <Login />}
            />
          </Switch>
        </Router>
      </div>
    );
  }
}

export default App;
