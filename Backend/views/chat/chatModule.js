import React, { Component } from 'react';
import io from 'socket.io-client';
import config from '../config';

import MessageView from './messageView';
import ChatInput from './chatInput';

class ChatModule extends Component {
   socket = {};
   constructor(props) {
      super(props);
      this.state = { messages: [] };
      this.sendHandler = this.sendHandler.bind(this);

      this.socket = io(config.api, { query: "username=${props.usrename" }).connect();

      this.socket.on("server.message", message => {
         this.addMessage(message);
      });
   }

   sendHandler(message) {
      const messageObject = {
         username: this.props.username,
         message
      }

      this.socket.emit("client:message", messageObject);

      messageObject.fromMe = true;
      this.addMessage(messageObject);
   }

   addMessage(message) {
      const messages = this.state.messages;
      messages.push(message);
      this.setState({ messages });
   }

   render() {
      return (
         <div className="container">
            <MessageView messages={this.state.messages} />
            <ChatInput onSend={this.sendHandler} />
         </div>
      );
   }
}

ChatModule.defaultProps = {
   username: "Anonymous"
}

export default ChatModule;