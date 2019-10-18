import React, { Component } from 'react';
import Message from './message';

class MessageView extends Component {
   componentDidUpdate() {
      const objDiv = document.getElementById('messageList');
      objDiv.scrollTop = objDiv.sc
   }

   render() {
      const messages = this.props.messages.map((message, i) => {
         return (
            <Message
               key={i}
               username={message.username}
               messageText={message.messageText}
               fromMe={message.fromMe}
            />
         );
      });

      return (
         <div classNames='messages' id='messageList'>
            { messages }
         </div>
      );
   }
}

Messages.defaultProps = {
   messages: []
}

export default MessageView;