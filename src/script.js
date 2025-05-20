import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { ScrollTrigger } from 'https://cdn.jsdelivr.net/npm/gsap@3.11.5/ScrollTrigger.min.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Register the ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Function to load random reviews
async function loadRandomReviews() {
    const { data, error } = await supabase
        .from('reviews')
        .select('*');

    if (error) {
        console.error("Error fetching reviews:", error);
        return;
    }

    const reviewsContainer = document.querySelector('.review-cards');
    reviewsContainer.innerHTML = ""; // Clear existing reviews

    if (!data || data.length === 0) {
        reviewsContainer.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to leave a review!</p>';
        return;
    }

    // Shuffle the reviews array (Fisher-Yates shuffle)
    const shuffledReviews = [...data];
    for (let i = shuffledReviews.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledReviews[i], shuffledReviews[j]] = [shuffledReviews[j], shuffledReviews[i]];
    }

    // Take up to 6 random reviews (or fewer if there are less than 6)
    const displayReviews = shuffledReviews.slice(0, Math.min(6, shuffledReviews.length));

    displayReviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.classList.add('review-card');

        // Add star rating display
        const fullStars = Math.floor(review.rating);
        const halfStar = review.rating % 1 >= 0.5 ? '½' : '';
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        const stars = '<i class="fas fa-star"></i>'.repeat(fullStars) +
                      (halfStar ? '<i class="fas fa-star-half-alt"></i>' : '') +
                      '<i class="far fa-star"></i>'.repeat(emptyStars);

        reviewCard.innerHTML = `
            <div style="display: flex; flex-direction: column; height: 100%; justify-content: space-between;" class="review-card-content">
              <div style="display: flex;" class="main-wrapper-for-review">
                  <img class="review-avatar" src="${review.avatar || 'https://via.placeholder.com/50'}" alt="${review.username}'s avatar">
                  <div style="display: flex; flex-direction: column; align-items: flex-start;" class="review-wrapper">
                      <h3 class="review-username">${review.username}</h3>
                      <p class="review-date">${review.date}</p>
                  </div>
              </div>
                    <p class="review-text">${review.text || 'No comment provided'}</p>
                    <p class="review-rating">${stars} <span class="rating-text">${review.rating}/5</span></p>
            </div>
        `;
        reviewsContainer.appendChild(reviewCard);
    });
}


// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu setup
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
    
    // Add event listeners to all mobile nav links
    document.querySelectorAll('.mobile-nav ul a').forEach(link => {
        link.addEventListener('click', () => {
            if (mobileNav) {
                mobileNav.classList.add('closed-menu');
            }
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
    }
    
    // Initialize the theme when DOM is loaded
    initTheme();
    
    // Load random reviews
    loadRandomReviews();
});

// Uncheck all checkboxes on load
const inputs = document.getElementsByTagName('input');
for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].type === 'checkbox') {
        inputs[i].checked = false;
    }
}

// Carousel cloning (duplicate items for infinite scroll effect)
const carousel = document.querySelector('.carousel');
const carouselItems = document.querySelectorAll('.carousel-item');
if (carousel && carouselItems.length > 0) {
    carouselItems.forEach(item => {
        const clone = item.cloneNode(true);
        carousel.appendChild(clone);
    });
}

// Project category filtering
function initializeProjectFilters() {
  const categoryBtns = document.querySelectorAll('.category-btn');
  const projectItems = document.querySelectorAll('.project-item');
  
  // Show random 6 projects initially
  const allProjects = Array.from(projectItems);
  const shuffledProjects = allProjects.sort(() => Math.random() - 0.5);
  
  allProjects.forEach(project => project.classList.add('hidden'));
  shuffledProjects.slice(0, 6).forEach(project => project.classList.remove('hidden'));

  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active button
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const category = btn.dataset.category;
      
      if (category === 'all') {
        // Show random 6 projects when "All" is selected
        const shuffled = allProjects.sort(() => Math.random() - 0.5);
        allProjects.forEach(project => project.classList.add('hidden'));
        shuffled.slice(0, 6).forEach(project => project.classList.remove('hidden'));
      } else {
        // Filter by category
        projectItems.forEach(item => {
          if (item.dataset.category === category) {
            item.classList.remove('hidden');
          } else {
            item.classList.add('hidden');
          }
        });
      }
    });
  });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    initTheme(); // Set the theme based on saved preference
    loadRandomReviews(); // Load random reviews on page load/refresh
    initializeProjectFilters(); // Initialize project filtering
});


// Store the interval ID globally
let lanyardIntervalId = null;
let lastLanyardUpdate = 0;
const LANYARD_UPDATE_INTERVAL = 60000; // 60 seconds between updates

// Function to update Lanyard image with proper rate limiting
function updateLanyardImage(isDark) {
    const now = Date.now();
    // Only update if sufficient time has passed since last update
    if (now - lastLanyardUpdate < LANYARD_UPDATE_INTERVAL) return;
    
    lastLanyardUpdate = now;
    const img = document.getElementById("lanyard");
    if (img) {
        const theme = isDark ? 'dark' : 'light';
        img.src = `https://lanyard.cnrad.dev/api/859866420887289877?bg=transparent&idleMessage=Silently%20defying%20productivity...&theme=${theme}&showDisplayName=true&animatedDecoration=true&hideDecoration=true&hideTimestamp=false&t=${now}`;
    }
}

// Theme toggle
document.getElementById('themeSwitch')?.addEventListener('change', function() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    
    // Save the current theme to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Clear existing interval if any
    if (lanyardIntervalId) {
        clearInterval(lanyardIntervalId);
    }
    
    // Update immediately, but respect rate limiting
    updateLanyardImage(isDark);
    
    // Set new interval with much lower frequency
    lanyardIntervalId = setInterval(() => {
        updateLanyardImage(isDark);
    }, LANYARD_UPDATE_INTERVAL);
});

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

async function loadDiscordWidget() {
    try {
        // Get server ID and token from environment variables or hardcode them (for demo)
        const serverId = '1124743907486687346';
        
        // Fetch server information using Discord API
        const response = await fetch(`https://discord.com/api/guilds/${serverId}/widget.json`);
        
        if (!response.ok) {
            console.error('Failed to fetch Discord widget data:', response.statusText);
            return;
        }
        
        const data = await response.json();
        
        // Update server details
        document.getElementById('server-name').textContent = data.name;
        document.getElementById('member-count').textContent = `${data.presence_count} members online`;
        document.getElementById('join-link').href = data.instant_invite;
        
        // Populate online members (limit to 5)
        const onlineMembers = document.getElementById('online-members');
        onlineMembers.innerHTML = '';
        
        const visibleMembers = data.members.slice(0, 5);
        
        visibleMembers.forEach(member => {
            const li = document.createElement('li');
            li.innerHTML = `
                <img src="${member.avatar_url}" alt="${member.username}">
                <span>${member.username}</span>
            `;
            onlineMembers.appendChild(li);
        });
        
    } catch (error) {
        console.error('Error loading Discord widget:', error);
    }
}

// Load Discord widget data when DOM is loaded
document.addEventListener('DOMContentLoaded', loadDiscordWidget);
  