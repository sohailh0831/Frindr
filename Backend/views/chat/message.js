import React, { Component } from 'react';

class Message extends Component {
   render() {
      const fromMe = this.props.fromMe ? "from-me" : '';

      return (
         <div className={"message ${fromMe}"}>
            <div className="username">
               { this.props.username }
            </div>
            <div className="body">
               { this.props.message }
            </div>
         </div>
      );
   }
}

Message.defaultProps = {
   message: "",
   username: "",
   fromMe: false
}

export default Message;