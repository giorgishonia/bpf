// Sample data structure
const gameData = {
    visits: [],    // From visits API
    details: [],   // From favorites API
    votes: []      // From votes API
};

async function fetchGameData() {
    try {
        // Fetch visits data
        const visitsResponse = await fetch('/api/games');
        if (!visitsResponse.ok) throw new Error(`HTTP error! status: ${visitsResponse.status}`);
        const visitsData = await visitsResponse.json();
        gameData.visits = visitsData.data || [];
        console.log('Visits Data:', gameData.visits);

        // Fetch details data
        const detailsResponse = await fetch('/api/favorites')
        if (!detailsResponse.ok) throw new Error(`HTTP error! status: ${detailsResponse.status}`);
        const detailsData = await detailsResponse.json();
        gameData.details = detailsData.Data?.Items || [];
        console.log('Details Data:', gameData.details);

        // Fetch votes data
        const votesResponse = await fetch('/api/votes');
        if (!votesResponse.ok) throw new Error(`HTTP error! status: ${votesResponse.status}`);
        const votesData = await votesResponse.json();
        gameData.votes = votesData.data || [];
        console.log('Votes Data:', gameData.votes);

        populateCarousel();
        updateStats();
    } catch (error) {
        console.error('Error fetching game data:', error.message);
    }
}

function populateCarousel() {
    const carousel = document.getElementById('gameCarousel');
    carousel.innerHTML = ''; // Clear previous content

    const totalGames = gameData.details.length;
    for (let i = 0; i < 2; i++) {
        gameData.details.forEach((game) => {
            const universeId = game.Item?.UniverseId;
            const visitData = gameData.visits.find(v => v.id === universeId);
            const voteData = gameData.votes.find(v => v.id === universeId);
            const imageUrl = game.Thumbnail?.Url || 'placeholder.jpg';

            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
                <img src="${game.Thumbnail?.Url || 'placeholder.jpg'}" alt="${game.Item?.Name || 'Game thumbnail'}">
                <div class="game-overlay">
                    <h3 class="game-name">${game.Item?.Name || 'Untitled Game'}</h3>
                    <div class="game-stats">
                        <div>Visits: ${visitData?.visits?.toLocaleString() || 'N/A'}</div>
                        <div>Likes: ${voteData?.upVotes?.toLocaleString() || 'N/A'}</div>
                    </div>
                </div>
            `;
            carousel.appendChild(card);
            
        });
    }

    carousel.scrollLeft = carousel.scrollWidth / 2;
}


function updateStats() {
    // Total projects
    const totalProjects = gameData.details.length;
    document.getElementById('totalProjects').textContent = totalProjects;

    // Total visits calculation
    const totalVisits = gameData.visits.reduce((sum, game) => sum + (game.visits || 0), 0);
    document.getElementById('totalVisits').textContent = totalVisits.toLocaleString();

    // Total votes calculation
    const totalVotes = gameData.votes.reduce((sum, game) => sum + (game.upVotes || 0), 0);
    document.getElementById('totalVotes').textContent = totalVotes.toLocaleString();
}

// Initial fetch
fetchGameData();



document.addEventListener('DOMContentLoaded', function() {
    // Calculate total votes from game cards
    calculateTotalVotes();
    
    // Add carousel navigation
    setupCarousel();
    
    // Add animation delay to game cards for staggered effect
    animateGameCards();
  });
  
  function calculateTotalVotes() {
    const likeElements = document.querySelectorAll('.game-stats div:nth-child(2)');
    let totalVotes = 0;
    
    likeElements.forEach(element => {
      const likesText = element.textContent;
      const likesNumber = parseInt(likesText.replace('Likes: ', '').trim());
      if (!isNaN(likesNumber)) {
        totalVotes += likesNumber;
      }
    });
    
    const totalVotesElement = document.getElementById('totalVotes');
    if (totalVotesElement) {
      totalVotesElement.textContent = totalVotes.toLocaleString();
    }
  }
  
  function setupCarousel() {
    const carousel = document.getElementById('gameCarousel');
    
    // Clear previous navigation buttons
    const existingNav = document.querySelector('.carousel-nav');
    if (existingNav) existingNav.remove();

    // Add navigation buttons inside the carousel
    const navDiv = document.createElement('div');
    navDiv.className = 'carousel-nav';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'carousel-btn prev-btn';
    prevBtn.innerHTML = '&larr;';
    prevBtn.setAttribute('aria-label', 'Previous games');
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'carousel-btn next-btn';
    nextBtn.innerHTML = '&rarr;';
    nextBtn.setAttribute('aria-label', 'Next games');
    
    navDiv.appendChild(prevBtn);
    navDiv.appendChild(nextBtn);
    carousel.appendChild(navDiv);
    
    // Scroll functionality
    prevBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: -600, behavior: 'smooth' });
    });
    
    nextBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: 600, behavior: 'smooth' });
    });
    
    // Add keyboard navigation
    carousel.tabIndex = 0;
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        carousel.scrollBy({ left: -300, behavior: 'smooth' });
      } else if (e.key === 'ArrowRight') {
        carousel.scrollBy({ left: 300, behavior: 'smooth' });
      }
    });

    // Infinite scroll logic
    carousel.addEventListener('scroll', () => {
        const scrollLeft = carousel.scrollLeft;
        const scrollWidth = carousel.scrollWidth;
        const clientWidth = carousel.clientWidth;

        // If scrolled to the end of the first set, reset to the start
        if (scrollLeft <= 0) {
            carousel.scrollLeft = scrollWidth / 2;
        } else if (scrollLeft >= scrollWidth - clientWidth) {
            carousel.scrollLeft = scrollWidth / 2;
        }
    });
  }
  
  function animateGameCards() {
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach((card, index) => {
      // Remove any existing animation
      card.style.animation = 'none';
      card.offsetHeight; // Trigger reflow
      
      // Add staggered animation
      card.style.animation = `fadeIn 0.5s ease forwards ${index * 0.05}s`;
      card.style.opacity = '0'; // Start invisible
    });
  }

  
// Uncheck all checkboxes on load
const inputs = document.getElementsByTagName('input');
for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].type === 'checkbox') {
        inputs[i].checked = false;
    }
}


// Theme toggle
document.getElementById('themeSwitch')?.addEventListener('change', function() {
    document.body.classList.toggle('dark');
    // Save the current theme to localStorage
    if (document.body.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

// Initialize theme based on saved preference
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeSwitch = document.getElementById('themeSwitch');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        if (themeSwitch) themeSwitch.checked = false; // Dark mode = switch OFF
    } else {
        document.body.classList.remove('dark');
        if (themeSwitch) themeSwitch.checked = true; // Light mode = switch ON
    }
}

initTheme();