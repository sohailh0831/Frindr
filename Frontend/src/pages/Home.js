import React, { Component } from 'react';
import { Form } from 'react-bootstrap';
import LoginButton from "../components/LoginButton";

import "../css/home.css";

class Home extends Component {
   componentDidMount() {
      document.title = "Frindr";
   }

   render() {
      return (
         <div className="background">
            <div className="home-form-wrapper">
               <h3>
                  Welcome to Frindr
               </h3>

               <Form className="innerForm">
                  <Form.Row>
                     <LoginButton />
                  </Form.Row>
               </Form>
            </div>
         </div>
      );
   }
}

export default Home;