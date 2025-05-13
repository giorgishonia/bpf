import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { ScrollTrigger } from 'https://cdn.jsdelivr.net/npm/gsap@3.11.5/ScrollTrigger.min.js';

const supabaseUrl = 'https://ociyjiapqvjcdtvpqrhb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jaXlqaWFwcXZqY2R0dnBxcmhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMDU2OTksImV4cCI6MjA1NjY4MTY5OX0.VT-bUTQoIDit2YV0dpKuA99gqleO0b9pZmGyBF5hDfM';
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
document.querySelector('.mobile-menu')?.addEventListener('click', () => {
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav) {
        mobileNav.classList.remove('closed-menu');
        mobileNav.classList.add('open-menu');
    }
});

document.querySelector('.tabler-icon')?.addEventListener('click', () => {
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav) {
        mobileNav.classList.remove('open-menu');
        mobileNav.classList.add('closed-menu');
    }
});

// Add event listeners to all mobile nav links
document.querySelectorAll('.mobile-nav ul a').forEach(link => {
    link.addEventListener('click', () => {
        const mobileNav = document.querySelector('.mobile-nav');
        if (mobileNav) {
            mobileNav.classList.remove('open-menu');
            mobileNav.classList.add('closed-menu');
        }
    });
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

// Function to update Lanyard image
function updateLanyardImage(isDark) {
    const img = document.getElementById("lanyard");
    if (img) {
        const theme = isDark ? 'dark' : 'light';
        img.src = `https://lanyard.cnrad.dev/api/859866420887289877?bg=transparent&idleMessage=Silently%20defying%20productivity...&theme=${theme}&showDisplayName=true&animatedDecoration=true&hideDecoration=true&hideTimestamp=false&t=${Date.now()}`;
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
    
    // Update immediately
    updateLanyardImage(isDark);
    
    // Set new interval
    lanyardIntervalId = setInterval(() => updateLanyardImage(isDark), 500);
});

// Initialize theme based on saved preference
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeSwitch = document.getElementById('themeSwitch');
    const isDark = savedTheme === 'dark';
    
    if (isDark) {
        document.body.classList.add('dark');
        if (themeSwitch) themeSwitch.checked = false; // Dark mode = switch OFF
    } else {
        document.body.classList.remove('dark');
        if (themeSwitch) themeSwitch.checked = true; // Light mode = switch ON
    }
    
    // Initialize Lanyard image
    updateLanyardImage(isDark);
    if (lanyardIntervalId) {
        clearInterval(lanyardIntervalId);
    }
    lanyardIntervalId = setInterval(() => updateLanyardImage(isDark), 1000);
}

initTheme();

async function loadDiscordWidget() {
    const serverId = "1258870317758283897"; // Your Discord server ID
    const apiUrl = `https://discord.com/api/guilds/${serverId}/widget.json`;
  
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("Failed to fetch server data");
      
      const data = await response.json();
  
      // Set server details
      document.getElementById("server-icon").src = data.icon_url || "./public/images/begis-basement.webp";
      document.getElementById("server-name").textContent = data.name;
      document.getElementById("member-count").textContent = `Online Members: ${data.presence_count}`;
      document.getElementById("join-link").href = data.instant_invite || "#";
  
      // Display online members
      const membersList = document.getElementById("online-members");
      membersList.innerHTML = ""; // Clear existing list
      data.members.forEach(member => {
        const listItem = document.createElement("li");
        listItem.textContent = member.username;
        membersList.appendChild(listItem);
      });
  
    } catch (error) {
      console.error("Error loading Discord widget:", error);
    }
  }
  
  // Load the widget on page load
  document.addEventListener("DOMContentLoaded", loadDiscordWidget);
  