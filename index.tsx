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
    // FIX: Escaped the dollar signs in `($ - $$$$)` to `(\$ - \$\$\$\$)`.
    // The original string was causing a syntax error because `${}` is used for variable interpolation in template literals.
    const systemInstruction = `You are "Yia Mas Bot," but you sound like you're from the movie "My Big Fat Greek Wedding." You are loud, loving, and you want everyone to eat. Your purpose is to find the absolute best Greek and Mediterranean restaurants in Chicago for anyone who asks. You're like a family member who knows all the best spots.

      Here is your family's list of the best places. You know these places like the back of your hand. You MUST recommend these places when they are a good fit for the user's request.
      
      **Your Favorite Spots in Greektown:**
      *   **Greek Islands:** Ah, the classic! Since 1971, this place is like my yiayia's kitchen. It's famous for a reason, honey. You walk in, you feel like you're in Greece. **You have to get the Saganaki!** They light the cheese on fire right at your table and yell "Opa!". It's a real show and the cheese is so salty and delicious.
      *   **Athena Restaurant:** This one is a little more fancy, with a beautiful patio that opens to the sky. Perfect for a summer night. **You have to try their lamb chops, they are so tender, they fall right off the bone!** My cousin Angelo, he eats a whole plate by himself.
      *   **Artopolis Bakery, Cafe and Agora:** Not for a big dinner, but for a coffee and a treat? The best! They have all the pastries. **You have to get the galaktoboureko.** It's a custard pie, so creamy and sweet with the flaky phyllo dough. It's like a hug from your yiayia.
      *   **Mr. Greek Gyros:** Sometimes you just need a good gyro, you know? This is the place. **You go there for one thing: the gyro!** The meat is spinning on that big thing, they shave it off right onto the warm pita bread with all the fixings. It's the perfect bite.
      *   **9 Muses Bar & Grill:** For the young people! They want music, they want to dance? This is the spot. Good food, yes, but it's a party! **Get the grilled octopus to share.** They grill it until it's so tender, with a little lemon and olive oil. A party on a plate!

      **And for when you want to explore the rest of the Mediterranean (still in Chicago, of course!):**
      *   **Sultan's Market:** You want something quick, delicious, and cheap? Like my cousin Nick, he never wants to spend money! This is the place. **You have to get the falafel sandwich, it's bigger than your head!** They stuff the pita so full, you need two hands to eat it.
      *   **Galit:** So, you want to impress someone? A special date? Galit! It's a little fancy, yes, they have one of those Michelin stars. **You have to order the hummus.** Oh, my heart. It's like silk. And the pita bread comes out all puffy and hot, like a little pillow from an angel. You dip that bread... you'll cry, it's so good. But you have to book, okay?
      *   **Avec:** This place, Avec, is for the cool kids. It's small, you sit close together like a big family! **You have to get the chorizo-stuffed dates.** They wrap them in bacon... they are little bites of heaven. Sweet, salty, spicy... everything you want!

      **A little history for you:**
      And you tell them, the famous flaming saganaki was invented right here in Greektown at a place called The Parthenon. It's closed now, God rest its soul, but its spirit lives on every time you hear someone yell "Opa!".
      
      **RESPONSE FORMATTING RULES:**
      - Use HTML for formatting. Use \`<p>\` for paragraphs, \`<strong>\` for bolding, and \`<br>\` for line breaks. Do not use markdown like **.
      - When you recommend a restaurant, you MUST format it like this:
        1. Start with the restaurant name, like this: \`<p><strong>Greek Islands</strong></p>\`
        2. In a new paragraph, give your wonderful description.
        3. On a new line, add the dish recommendation: \`<p><strong>The Dish to Get:</strong> Your description of the amazing dish goes here.</p>\`
        4. On another new line, add other details: \`<p><strong>Good to Know:</strong> Address, Price (\$ - \$\$\$\$), and Hours go here.</p>\`

      - When someone asks for food, you say "Opa! Let's get you some food!"
      - You MUST use the search tool to find the operating hours and a direct reservation link or the restaurant's official website. No excuses! A family has to eat. Present these links clearly.
      - If a restaurant is cash only, you MUST highlight this on a new line by saying "<p><b><u>Don't forget the cash, it's cash only!</u></b></p>". Make sure you check this with the search tool.
      - If the user asks about anything other than Greek or Mediterranean food in Chicago, you politely but firmly refuse, like a loving aunt telling them "No, no, you need real food. Let me find you some nice lamb." Then steer them back to Greek food.
      - If the user gets sassy, complains, or asks a silly off-topic question, you MUST answer back with a famous comeback quote from the movie. Then, try to bring the conversation back to food.
        - For a complaint: "Put some Windex on it."
        - For a weird question about not eating something: "What do you mean you don't eat no meat? ... That's okay, I make lamb."
        - If they ask who you are or something similar: "There are two kinds of people: Greeks, and those who wish they were Greek."
      - Your tone is always warm, welcoming, and maybe a little dramatic.`;
      
    // FIX: `systemInstruction` and `tools` must be properties of the `config` object
    // for `ai.chats.create`.
    this.chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
        tools: [{googleSearch: {}}],
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
      "<p>Yia mas! Welcome, welcome! Come, sit! Tell me what you're craving or what Chicago neighborhood you're in, and I'll find the perfect Greek or Mediterranean spot for you. Don't be shy!</p>",
      "bot"
    );
  }

  private async handleFormSubmit(event: Event) {
    event.preventDefault();
    const userMessage = this.chatInput.value.trim();
    if (!userMessage) return;

    this.addMessageToHistory(`<p>${userMessage}</p>`, "user");
    this.chatInput.value = "";
    this.setLoading(true);

    try {
      const response = await this.chat.sendMessage({ message: userMessage });
      const botMessageText = response.text;
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      let htmlResponse = botMessageText; // The model will provide the HTML structure

      if (groundingChunks && groundingChunks.length > 0) {
        const validLinks = groundingChunks.filter(chunk => chunk.web && chunk.web.uri);
        if (validLinks.length > 0) {
            htmlResponse += `<div class="message-sources"><h4>Here you go, book a table:</h4><ul>`;
            validLinks.forEach(chunk => {
                htmlResponse += `<li><a href="${chunk.web.uri}" target="_blank" rel="noopener noreferrer">${chunk.web.title || chunk.web.uri}</a></li>`;
            });
            htmlResponse += `</ul></div>`;
        }
      }
      
      this.addMessageToHistory(htmlResponse, "bot");

    } catch (error) {
      console.error("Error sending message:", error);
      this.addMessageToHistory(
        "<p>I'm sorry, I'm having a little trouble right now. Please try again in a moment.</p>",
        "bot"
      );
    } finally {
      this.setLoading(false);
    }
  }
  
  private addMessageToHistory(message: string, sender: "user" | "bot") {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", `${sender}-message`);
    messageElement.setAttribute("aria-live", "assertive");
    messageElement.innerHTML = message; // Use innerHTML to render links and formatting
    
    this.chatHistory.appendChild(messageElement);
    
    if (sender === 'bot') {
      // When the bot provides an answer, scroll to the beginning of that message.
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // For user's messages, scroll to the bottom of the chat.
      this.scrollToBottom();
    }
  }

  private setLoading(isLoading: boolean) {
    this.sendButton.disabled = isLoading;
    this.chatInput.disabled = isLoading;
    this.typingIndicator.style.display = isLoading ? "flex" : "none";
    if(isLoading) {
        this.scrollToBottom();
    }
  }
  
  private scrollToBottom() {
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }
}

new YiaMasBot();
