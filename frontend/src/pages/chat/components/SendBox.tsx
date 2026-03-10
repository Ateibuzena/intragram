import '../styles/SendBox.css'

import { SendButton } from '../components/Buttons'

export default function SendBox() {
    return (
        <div className="send-box">
            <input type="text" placeholder="Type your message..." className="message-input" />
            <SendButton />
        </div>
    );
}