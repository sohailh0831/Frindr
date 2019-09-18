import React, { Component } from "react";
import { Form, Button } from 'react-bootstrap';

import '../css/style.css';
import '../css/login.css';

class Login extends Component {
   componentDidMount() {
      document.title = "Frindr";
   }
   constructor(props) {
      super(props);

      this.state = {
         username: '',
         email: '',
         password: ''
      };
   }

   handleChange = event => { //store user input
      this.setState(
         { [event.target.name]: event.target.value }
      )
      //console.log(event.target.name);
      //console.log(event.target.value);
   }

   handleSubmit = event => {
      event.preventDefault();

      const user = this.state

      console.log(user)
   }

   render() {
      if (this.props.error) {
         console.log(this.props.error.message)
      }

      return (
         <div className="background">

            <div className='login-form-wrapper'>
               <h3>
                  Log In
          </h3>

               <Form
                  onSubmit={this.handleSubmit}
                  className="innerForm">
                  <Form.Row>
                     <Form.Group controlId="username">
                        <Form.Control
                           type="text"
                           placeholder="Username"
                           name="username"
                           value={this.state.username}
                           onChange={this.handleChange}
                        />
                     </Form.Group>

                     <Form.Group controlId="password">
                        <Form.Control
                           type="text"
                           placeholder="Password"
                           name="password"
                           value={this.state.password}
                           onChange={this.handleChange}
                        />
                     </Form.Group>

                  </Form.Row>

                  <Button variant="dark" type="submit">
                     {"Log In"}
                  </Button>
               </Form>
            </div>
         </div>
      )
   }
}

export default Login;