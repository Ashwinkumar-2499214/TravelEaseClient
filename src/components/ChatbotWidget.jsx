import { useEffect } from 'react';

export default function ChatbotWidget() {
  useEffect(() => {
    // 1. Create the script element
    const script = document.createElement('script');
    script.src = "https://cdn.chatbotplatform.com/widget.js"; // Replace with your platform's URL
    script.async = true;

    // 2. Initialize the bot once the script loads
    script.onload = () => {
      if (window.ChatbotWidget) {
        window.ChatbotWidget.init({
          botId: "your-unique-bot-id-12345", // Replace with your actual bot ID
        });
      }
    };

    // 3. Inject script into the document body
    document.body.appendChild(script);

    // 4. Cleanup function (runs when the user leaves/logs out)
    return () => {
      // Remove the script tag
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      
      // Clean up the iframe/widget container the platform injects (if applicable)
      // Tip: Inspect your page element to see the exact ID or Class your provider uses
      const widget = document.querySelector('.chatbot-widget-window') || document.getElementById('chatbot-widget');
      if (widget) {
        widget.remove();
      }
    };
  }, []); // Empty array ensures this only runs once when the app mounts

  return null; // This component doesn't need to render any HTML itself
}