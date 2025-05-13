export class CreditsUI {
    constructor() {
        this.createCreditsScreen();
    }

    createCreditsScreen() {
        const creditsDiv = document.createElement('div');
        creditsDiv.className = 'fixed inset-0 flex flex-col justify-center items-center bg-black/90 font-["Share_Tech_Mono"] z-[1000]';

        // Reuse the same title styling from MainMenuUI
        const titleContainer = document.createElement('div');
        titleContainer.className = 'mb-12 text-center';

        const mainTitle = document.createElement('h1');
        mainTitle.className = 'text-amber-400 text-6xl font-bold tracking-wider mb-2';
        mainTitle.style.textShadow = '0 0 10px rgba(251, 191, 36, 0.7), 0 0 20px rgba(251, 191, 36, 0.5)';
        mainTitle.textContent = 'DEUS EX';

        const subTitle = document.createElement('h2');
        subTitle.className = 'text-amber-600 text-4xl tracking-[0.2em]';
        subTitle.style.textShadow = '0 0 8px rgba(217, 119, 6, 0.7)';
        subTitle.textContent = 'NEON MERLION';

        // Add decorative line
        const decorLine = document.createElement('div');
        decorLine.className = 'w-3/5 h-0.5 mb-12';
        decorLine.style.background = 'linear-gradient(90deg, rgba(217,119,6,0) 0%, rgba(217,119,6,1) 50%, rgba(217,119,6,0) 100%)';
        
        const credits = document.createElement('div');
        credits.innerHTML = `
            <h2 class="text-amber-400 text-3xl mb-8 text-center">CREDITS</h2>
            <div class="text-amber-200 text-xl space-y-4 text-center">
                <p>Thank you for playing!</p>
                <p>Created by: vitenner</p>
                <p>Special Thanks: axlee, jlum, ssian, yoong</p>
            </div>
        `;
        
        const backButton = document.createElement('button');
        backButton.className = 'bg-amber-600 text-gray-900 border-b-3 border-amber-800 px-8 py-3 text-2xl cursor-pointer font-["Share_Tech_Mono"] tracking-wider mt-12 transition-all duration-200 hover:bg-amber-500 hover:border-amber-600 hover:-translate-y-0.5';
        backButton.textContent = 'BACK TO MAIN MENU';
        
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
        
        titleContainer.appendChild(mainTitle);
        titleContainer.appendChild(subTitle);
        
        creditsDiv.appendChild(titleContainer);
        creditsDiv.appendChild(decorLine);
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