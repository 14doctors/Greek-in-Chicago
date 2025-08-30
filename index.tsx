/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Chat } from "@google/genai";

class YiaMasBot {
  private chat: Chat;
  private chatHistory: HTMLElement;
  private chatForm: HTMLFormElement;
  private chatInput: HTMLInputElement;
  private sendButton: HTMLButtonElement;
  private typingIndicator: HTMLElement;
  private chatContainer: HTMLElement;

  constructor() {
    this.initializeChat();
    this.cacheDOMElements();
    this.addEventListeners();
    this.displayWelcomeMessage();
  }

  private initializeChat() {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `You are "Yia Mas Bot," a friendly and expert guide to Greek and Mediterranean dining in Chicago. Your purpose is to provide precise, curated recommendations.
      - When a user asks for a recommendation, provide the restaurant's name, address, a price point ($ - $$$$), a concise summary, and a link for reservations if possible.
      - You can handle searches by neighborhood, specific cravings (e.g., "best octopus," "saganaki"), or filters like "lighter options" (salads, grilled fish, etc.).
      - Your knowledge is from a curated, high-quality database of vetted Chicago restaurants, not a generic web search.
      - If the user asks about anything other than Greek or Mediterranean food in Chicago, politely decline and steer the conversation back to your purpose. Maintain a warm and welcoming tone.`;
      
    this.chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
    });
  }

  private cacheDOMElements() {
    this.chatHistory = document.getElementById("chat-history")!;
    this.chatForm = document.getElementById("chat-form") as HTMLFormElement;
    this.chatInput = document.getElementById("chat-input") as HTMLInputElement;
    this.sendButton = document.getElementById("send-button") as HTMLButtonElement;
    this.typingIndicator = document.getElementById("typing-indicator")!;
    this.chatContainer = document.getElementById("chat-container")!;
  }

  private addEventListeners() {
    this.chatForm.addEventListener("submit", this.handleFormSubmit.bind(this));
  }
  
  private displayWelcomeMessage() {
    this.addMessageToHistory(
      "Yia mas! Welcome. Tell me what you're craving or what Chicago neighborhood you're in, and I'll find the perfect Greek or Mediterranean spot for you.",
      "bot"
    );
  }

  private async handleFormSubmit(event: Event) {
    event.preventDefault();
    const userMessage = this.chatInput.value.trim();
    if (!userMessage) return;

    this.addMessageToHistory(userMessage, "user");
    this.chatInput.value = "";
    this.setLoading(true);

    try {
      const responseStream = await this.chat.sendMessageStream({ message: userMessage });
      let botMessage = "";
      const botMessageElement = this.addMessageToHistory("", "bot", true);
      
      for await (const chunk of responseStream) {
        botMessage += chunk.text;
        // Use innerText to prevent potential HTML injection
        botMessageElement.innerText = botMessage;
        this.scrollToBottom();
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      this.addMessageToHistory(
        "I'm sorry, I'm having a little trouble right now. Please try again in a moment.",
        "bot"
      );
    } finally {
      this.setLoading(false);
    }
  }
  
  private addMessageToHistory(message: string, sender: "user" | "bot", streaming = false): HTMLElement {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", `${sender}-message`);
    messageElement.setAttribute("aria-live", "assertive");
    messageElement.innerText = message; // Safely set text content
    
    this.chatHistory.appendChild(messageElement);
    this.scrollToBottom();
    return messageElement;
  }

  private setLoading(isLoading: boolean) {
    this.sendButton.disabled = isLoading;
    this.typingIndicator.style.display = isLoading ? "block" : "none";
    if(isLoading) {
        this.scrollToBottom();
    }
  }
  
  private scrollToBottom() {
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }
}

new YiaMasBot();
