import React, { Component } from 'react';
import { Button } from 'react-bootstrap'

class LoginButton extends Component {
   constructor(props) {
      super(props);

      this.handleClick = this.handleClick.bind(this);

      this.state = {
         isLoading: false
      }
   }

   handleClick() {
      window.location.href = "/login";
   }

   render() {
      const { isLoading } = this.state;

      return (
         <Button
            variant="dark"
            onClick={!isLoading ? this.handleClick : null}
         >
            Login
      </Button>
      );
   }
}

export default LoginButton;