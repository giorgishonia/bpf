// Sample data structure
const gameData = {
    visits: [],    // From visits API
    details: [],   // From favorites API
    votes: []      // From votes API
};

// Roblox Projects Data
const robloxProjects = [
    {
        id: 1,
        name: "Dungeon Quest",
        description: "A dynamic dungeon crawler with procedurally generated levels, combat mechanics, and inventory system.",
        thumbnail: "assets/roblox1.jpg",
        category: "gameplay",
        videoId: "N0mzfv3J1HM",
        tags: ["Combat", "Dungeons", "RPG"]
    },
    {
        id: 2,
        name: "Boxing System",
        description: "Complete boxing system with inventory, NPC hiring and upgrading for competitive gameplay.",
        thumbnail: "assets/roblox2.jpg",
        category: "combat",
        videoId: "I8umOm0tLgc",
        tags: ["Combat", "Sports", "PVP"]
    },
    {
        id: 3,
        name: "Restocking System",
        description: "Dynamic inventory management with real-time restocking capabilities for shop and vending systems.",
        thumbnail: "assets/roblox3.jpg",
        category: "ui",
        videoId: "jXDylWP0bJ8",
        tags: ["UI/UX", "Inventory", "Economy"]
    },
    {
        id: 4,
        name: "Placement System",
        description: "Interactive object placement with removal capabilities for building experiences in Roblox games.",
        thumbnail: "assets/roblox4.jpg",
        category: "gameplay",
        videoId: "4QiP0UK-Saw",
        tags: ["Building", "Interaction", "Editor"]
    },
    {
        id: 5,
        name: "AI NPC System",
        description: "Dynamic AI-driven NPCs with conversational capabilities, adaptable to any character type in Roblox.",
        thumbnail: "assets/roblox5.jpg",
        category: "backend",
        videoId: "oHQgNq_F4eQ",
        tags: ["AI", "NPCs", "Dialog"]
    },
];

// Auto-scroll variables
let autoScrollInterval;
let currentIndex = 0;
let maxIndex = 0;
let isAutoScrollPaused = false;
let isScrollingLeft = false;

async function fetchGameData() {
    try {
        // Fetch visits data
        const visitsResponse = await fetch('/api/games').catch(() => {
            console.log('Using fallback data for visits');
            return { ok: false };
        });
        
        if (visitsResponse.ok) {
        const visitsData = await visitsResponse.json();
        gameData.visits = visitsData.data || [];
        console.log('Visits Data:', gameData.visits);
        } else {
            // Use fallback data if API is not available
            gameData.visits = Array.from({ length: 5 }, (_, i) => ({
                id: i + 1,
                visits: Math.floor(Math.random() * 100000) + 10000
            }));
        }

        // Fetch details data
        const detailsResponse = await fetch('/api/favorites').catch(() => {
            console.log('Using fallback data for details');
            return { ok: false };
        });
        
        if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        gameData.details = detailsData.Data?.Items || [];
        console.log('Details Data:', gameData.details);
        } else {
            // Use fallback data if API is not available
            gameData.details = Array.from({ length: 5 }, (_, i) => ({
                Item: {
                    UniverseId: i + 1,
                    Name: `Roblox Game ${i + 1}`
                },
                Thumbnail: {
                    Url: `assets/roblox${i + 1}.jpg`
                }
            }));
        }

        // Fetch votes data
        const votesResponse = await fetch('/api/votes').catch(() => {
            console.log('Using fallback data for votes');
            return { ok: false };
        });
        
        if (votesResponse.ok) {
        const votesData = await votesResponse.json();
        gameData.votes = votesData.data || [];
        console.log('Votes Data:', gameData.votes);
        } else {
            // Use fallback data if API is not available
            gameData.votes = Array.from({ length: 5 }, (_, i) => ({
                id: i + 1,
                upVotes: Math.floor(Math.random() * 10000) + 1000
            }));
        }

        populateCarousel();
        updateStats();
        startCarouselAutoScroll(); // Start auto-scroll after populating carousel
    } catch (error) {
        console.error('Error fetching game data:', error.message);
        
        // Use fallback data if any error occurs
        gameData.visits = Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            visits: Math.floor(Math.random() * 100000) + 10000
        }));
        
        gameData.details = Array.from({ length: 5 }, (_, i) => ({
            Item: {
                UniverseId: i + 1,
                Name: `Roblox Game ${i + 1}`
            },
            Thumbnail: {
                Url: `assets/roblox${i + 1}.jpg`
            }
        }));
        
        gameData.votes = Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            upVotes: Math.floor(Math.random() * 10000) + 1000
        }));
        
        populateCarousel();
        updateStats();
        startCarouselAutoScroll();
    }
}

function populateCarousel() {
    const carousel = document.getElementById('gameCarousel');
    carousel.innerHTML = ''; // Clear previous content

    // Display all games
        gameData.details.forEach((game) => {
            const universeId = game.Item?.UniverseId;
            const visitData = gameData.visits.find(v => v.id === universeId);
            const voteData = gameData.votes.find(v => v.id === universeId);
        
        // Use placeholder image if no thumbnail is available
        const imageUrl = game.Thumbnail?.Url || 'assets/placeholder.jpg';

            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
            <img src="${imageUrl}" alt="${game.Item?.Name || 'Game thumbnail'}" onerror="this.src='assets/placeholder.jpg'">
                <div class="game-overlay">
                <div class="game-name">${game.Item?.Name || 'Untitled Game'}</div>
                    <div class="game-stats">
                    <div>${visitData?.visits?.toLocaleString() || '0'}</div>
                    <div>${voteData?.upVotes?.toLocaleString() || '0'}</div>
                </div>
                </div>
            `;
            carousel.appendChild(card);
    });

    // Create pagination dots for each card
    const paginationContainer = document.querySelector('.carousel-pagination');
    paginationContainer.innerHTML = '';
    
    maxIndex = gameData.details.length - 1;
    
    // Create a dot for each project
    for (let i = 0; i <= maxIndex; i++) {
        const dot = document.createElement('div');
        dot.className = i === 0 ? 'pagination-dot active' : 'pagination-dot';
        dot.setAttribute('data-index', i);
        dot.addEventListener('click', () => {
            scrollToCard(i);
        });
        
        paginationContainer.appendChild(dot);
    }
    
    // Initialize at the first card
    currentIndex = 0;
    updateActiveDot();
}

// Scroll to a specific card by index
function scrollToCard(index) {
    const carousel = document.getElementById('gameCarousel');
    if (!carousel) return;
    
    // Get card width (including gap)
    const cardWidth = getCardTotalWidth();
    
    // Calculate scroll position
    const scrollPosition = index * cardWidth;
    
    // Smooth scroll to position
    carousel.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
    });
    
    // Update current index and active dot
    currentIndex = index;
    updateActiveDot();
    
    // Pause auto-scroll temporarily
    isAutoScrollPaused = true;
    setTimeout(() => { isAutoScrollPaused = false; }, 3000);
}

// Update the active pagination dot
function updateActiveDot() {
    const dots = document.querySelectorAll('.pagination-dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
    });
}

// Calculate total width of a card including margin/gap
function getCardTotalWidth() {
    const carousel = document.getElementById('gameCarousel');
    if (!carousel) return 0;
    
    const card = carousel.querySelector('.game-card');
    if (!card) return 0;
    
    // Get computed styles to account for margins and gaps
    const computedStyle = window.getComputedStyle(card);
    const width = card.offsetWidth;
    
    // Add gap from CSS var (--grid-gap)
    const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-gap')) || 25;
    
    return width + gap;
}

// Start auto-scrolling the carousel
function startCarouselAutoScroll() {
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
    }
    
    autoScrollInterval = setInterval(() => {
        if (!isAutoScrollPaused) {
            const currentPosition = carousel.scrollLeft;
            const cardWidth = carousel.querySelector('.game-card').offsetWidth;
            const margin = parseInt(window.getComputedStyle(carousel.querySelector('.game-card')).marginRight);
            const scrollDistance = cardWidth + margin;
            
            if (isScrollingLeft) {
                carousel.scrollTo({
                    left: currentPosition - scrollDistance,
                    behavior: 'smooth'
                });
                
                // If we've scrolled to the beginning, change direction
                if (currentPosition <= scrollDistance) {
                    isScrollingLeft = false;
                }
            } else {
                carousel.scrollTo({
                    left: currentPosition + scrollDistance,
                    behavior: 'smooth'
                });
                
                // If we've scrolled to the end, change direction
                if (currentPosition >= carousel.scrollWidth - carousel.clientWidth - scrollDistance) {
                    isScrollingLeft = true;
                }
            }
            
            updateActiveDot();
        }
    }, 1500); // Changed from 5000 to 1500 for auto-scroll every 1.5 seconds
    
    // Stop auto-scroll when user interacts with carousel
    const carousel = document.getElementById('gameCarousel');
    if (!carousel) return;
    
    carousel.addEventListener('mouseenter', () => {
        isAutoScrollPaused = true;
    });
    
    carousel.addEventListener('mouseleave', () => {
        isAutoScrollPaused = false;
    });
    
    carousel.addEventListener('touchstart', () => {
        isAutoScrollPaused = true;
    });
    
    carousel.addEventListener('touchend', () => {
        setTimeout(() => { isAutoScrollPaused = false; }, 3000);
    });
    
    // Handle manual scrolling with scroll event
    carousel.addEventListener('scroll', handleScrollEvent);
}

// Track scroll position and update active dot
function handleScrollEvent() {
    const carousel = document.getElementById('gameCarousel');
    if (!carousel) return;
    
    // Debounce the scroll event
    clearTimeout(carousel.scrollTimeout);
    carousel.scrollTimeout = setTimeout(() => {
        const cardWidth = getCardTotalWidth();
        const scrollPosition = carousel.scrollLeft;
        
        // Calculate the closest card index
        const newIndex = Math.round(scrollPosition / cardWidth);
        
        // Only update if changed
        if (newIndex !== currentIndex && newIndex >= 0 && newIndex <= maxIndex) {
            currentIndex = newIndex;
            updateActiveDot();
        }
    }, 100);
}

function updateStats() {
    // Total projects
    const totalProjects = gameData.details.length + robloxProjects.length;
    const totalProjectsElement = document.querySelector('.stat-value[data-target="24"]');
    if (totalProjectsElement) {
        totalProjectsElement.setAttribute('data-target', totalProjects);
        animateCounter(totalProjectsElement, totalProjects);
    }

    // Total visits calculation
    const totalVisits = gameData.visits.reduce((sum, game) => sum + (game.visits || 0), 0);
    const totalVisitsElement = document.querySelector('.stat-value[data-target="64500"]');
    if (totalVisitsElement) {
        totalVisitsElement.setAttribute('data-target', totalVisits);
        animateCounter(totalVisitsElement, totalVisits);
    }

    // Total votes calculation
    const totalVotes = gameData.votes.reduce((sum, game) => sum + (game.upVotes || 0), 0);
    const totalVotesElement = document.querySelector('.stat-value[data-target="18700"]');
    if (totalVotesElement) {
        totalVotesElement.setAttribute('data-target', totalVotes);
        animateCounter(totalVotesElement, totalVotes);
    }
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        element.textContent = Math.floor(current).toLocaleString();
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        }
    }, 10);
}

document.addEventListener('DOMContentLoaded', function() {
    // Fetch game data from APIs or use fallback data
    fetchGameData();
    
    // Populate the project showcase grid with Roblox projects
    populateProjectGrid('all');
    
    // Setup filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter and re-render projects
            populateProjectGrid(filter);
        });
    });
    
    // Setup theme toggle
    const themeSwitch = document.getElementById('themeSwitch');
    if (themeSwitch) {
        themeSwitch.addEventListener('change', function() {
            if (this.checked) {
                // If the switch is ON (which means it's light mode)
                document.body.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            } else {
                // If the switch is OFF (which means it's dark mode)
                document.body.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            }
        });
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
            themeSwitch.checked = false; // Switch should be OFF if dark mode is applied
        } else {
            document.body.classList.remove('dark');
            themeSwitch.checked = true; // Switch should be ON if light mode is applied
        }
    }
    
    // Setup mobile menu
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const mobileNav = document.getElementById('mobileNav');
    const mobileCloseBtn = document.querySelector('#mobileNav span');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileNav.classList.remove('closed-menu');
        });
    }
    
    if (mobileCloseBtn && mobileNav) {
        mobileCloseBtn.addEventListener('click', function() {
            mobileNav.classList.add('closed-menu');
        });
    }
    
    // Add keyboard navigation for carousel
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            if (currentIndex > 0) {
                scrollToCard(currentIndex - 1);
            }
        } else if (e.key === 'ArrowRight') {
            if (currentIndex < maxIndex) {
                scrollToCard(currentIndex + 1);
            }
        }
    });
    
    // Initialize the theme
    initTheme();
});

function populateProjectGrid(filter) {
    const showcaseGrid = document.querySelector('.showcase-grid');
    if (!showcaseGrid) return;
    
    showcaseGrid.innerHTML = '';
    
    const filteredProjects = filter === 'all' 
        ? robloxProjects 
        : robloxProjects.filter(project => project.category === filter);
    
    filteredProjects.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'project-item';
        projectItem.setAttribute('data-category', project.category);
        
        let actionButtons = '';
        
        if (project.videoId) {
            actionButtons = `
                <button class="project-btn play-video" data-video="${project.videoId}">
                    <i class="fas fa-play"></i>
                </button>
                <button class="project-btn">
                    <i class="fas fa-info-circle"></i>
                </button>
            `;
        } else {
            actionButtons = `
                <button class="project-btn coming-soon-btn">
                    <i class="fas fa-clock"></i>
                </button>
            `;
        }
        
        projectItem.innerHTML = `
            <div class="video-wrapper">
                ${project.videoId 
                    ? `<img src="${project.thumbnail}" alt="${project.name}" class="video-thumbnail" onerror="this.src='assets/placeholder.jpg'">`
                    : `<div class="video-placeholder"><i class="fas fa-${project.category === 'monetization' ? 'dollar-sign' : project.category === 'backend' ? 'database' : 'gamepad'} placeholder-icon"></i></div>`
                }
                <div class="project-overlay">
                    <div class="project-actions">
                        ${actionButtons}
                    </div>
                </div>
            </div>
            <div class="project-info">
                <h3>${project.name}</h3>
                <p>${project.description}</p>
                <div class="project-tags">
                    ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
        
        showcaseGrid.appendChild(projectItem);
    });
    
    // Add event listeners to video play buttons
    document.querySelectorAll('.play-video').forEach(button => {
        button.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video');
            if (videoId) {
                openVideoModal(videoId);
            }
        });
    });
    
    // Add animation to newly added items
    const items = document.querySelectorAll('.project-item');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 100 * index);
    });
}

function openVideoModal(videoId) {
    const videoModal = document.querySelector('.video-modal');
    const modalContent = document.querySelector('.modal-content');
    
    if (!videoModal || !modalContent) return;
    
    modalContent.innerHTML = `
        <span class="close-modal">&times;</span>
        <div class="modal-video-container">
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
        </div>
    `;
    
    videoModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Add event listener to close button
    const closeButton = document.querySelector('.close-modal');
    if (closeButton) {
        closeButton.addEventListener('click', closeVideoModal);
    }
    
    // Close modal when clicking outside the content
    videoModal.addEventListener('click', function(event) {
        if (event.target === videoModal) {
            closeVideoModal();
        }
    });
  }
  
function closeVideoModal() {
    const videoModal = document.querySelector('.video-modal');
    
    if (videoModal) {
        videoModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear modal content to stop video
        const modalContent = document.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = '';
        }
    }
}

// Initialize theme based on saved preference
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeSwitch = document.getElementById('themeSwitch');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        if (themeSwitch) themeSwitch.checked = false; // Switch should be OFF if dark mode is applied
    } else {
        document.body.classList.remove('dark');
        if (themeSwitch) themeSwitch.checked = true; // Switch should be ON if light mode is applied
    }
}

// Call initTheme immediately to ensure theme is correctly set before DOM is loaded
initTheme();