export class CreditsUI {
    constructor() {
        this.createCreditsScreen();
    }

    createCreditsScreen() {
        const creditsDiv = document.createElement('div');
        creditsDiv.style.position = 'absolute';
        creditsDiv.style.top = '0';
        creditsDiv.style.left = '0';
        creditsDiv.style.width = '100%';
        creditsDiv.style.height = '100%';
        creditsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        creditsDiv.style.color = '#f0f0f0';
        creditsDiv.style.display = 'flex';
        creditsDiv.style.flexDirection = 'column';
        creditsDiv.style.justifyContent = 'center';
        creditsDiv.style.alignItems = 'center';
        creditsDiv.style.fontFamily = 'Arial, sans-serif';
        creditsDiv.style.zIndex = '1000';
        
        const title = document.createElement('h1');
        title.textContent = 'DEUS EX: NEON MERLION';
        title.style.fontSize = '3rem';
        title.style.marginBottom = '2rem';
        title.style.color = '#fbbf24';
        
        const credits = document.createElement('div');
        credits.innerHTML = `
            <h2>CREDITS</h2>
            <p>Thank you for playing!</p>
            <p>Created by: Your Name</p>
            <p>Powered by: Babylon.js and Claude AI</p>
            <p>Music: Various Artists</p>
            <p>Special Thanks: The Anthropic Team</p>
        `;
        credits.style.textAlign = 'center';
        credits.style.fontSize = '1.5rem';
        credits.style.lineHeight = '2.5rem';
        
        const backButton = document.createElement('button');
        backButton.textContent = 'BACK TO MAIN MENU';
        backButton.style.marginTop = '3rem';
        backButton.style.padding = '1rem 2rem';
        backButton.style.fontSize = '1.2rem';
        backButton.style.backgroundColor = '#d97706';
        backButton.style.color = '#111827';
        backButton.style.border = 'none';
        backButton.style.borderRadius = '4px';
        backButton.style.cursor = 'pointer';
        
        // Restore and update main menu return logic
        backButton.onclick = () => {
            // Remove the credits UI
            if (creditsDiv.parentNode) {
                creditsDiv.parentNode.removeChild(creditsDiv);
            }
            
            // Return to main menu using levelProgression
            if (window.levelProgression) {
                window.levelProgression.showMainMenu();
            }
        };
        
        creditsDiv.appendChild(title);
        creditsDiv.appendChild(credits);
        creditsDiv.appendChild(backButton);
        
        document.body.appendChild(creditsDiv);
    }

    // Add dispose method for cleanup
    dispose() {
        const creditsDiv = document.querySelector('div[style*="position: absolute"]');
        if (creditsDiv && creditsDiv.parentNode) {
            creditsDiv.parentNode.removeChild(creditsDiv);
        }
    }
}