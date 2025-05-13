import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabase = createClient(
    'https://ociyjiapqvjcdtvpqrhb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jaXlqaWFwcXZqY2R0dnBxcmhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMDU2OTksImV4cCI6MjA1NjY4MTY5OX0.VT-bUTQoIDit2YV0dpKuA99gqleO0b9pZmGyBF5hDfM'
);

// DOM Elements
const reviewModal = document.getElementById('review-modal');
const authModal = document.getElementById('auth-modal');
const addReviewBtn = document.getElementById('add-review-btn');
const closeBtns = document.querySelectorAll('.close');
const discordLoginBtn = document.getElementById('discord-login');
const authDiscordLoginBtn = document.getElementById('auth-discord-login');
const logoutBtn = document.getElementById('logout');
const reviewForm = document.getElementById('review-form');
const userInfo = document.getElementById('user-info');
const profilePic = document.getElementById('profile-pic');
const userName = document.getElementById('user-name');
const themeSwitch = document.getElementById('themeSwitch');

// State
let isAuthenticated = false;
let userData = null;
let userHasReviewed = false;

// Modify the checkAuth function to properly handle persistent sessions
async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error checking auth status:', error);
        return;
    }
    
    if (session) {
        const { user } = session;
        isAuthenticated = true;
        userData = {
            id: user.id,
            username: user.user_metadata?.full_name || 'Unknown User',
            avatar: user.user_metadata?.avatar_url || 'https://via.placeholder.com/50'
        };
        updateUI();
        loadReviews();
    }
}

// Update UI based on authentication status
function updateUI() {
    if (isAuthenticated) {
        userInfo.style.display = 'flex';
        discordLoginBtn.style.display = 'none';
        logoutBtn.style.display = 'block'; // Show logout button
        profilePic.src = userData.avatar;
        userName.textContent = userData.username;
    } else {
        userInfo.style.display = 'none';
        discordLoginBtn.style.display = 'block';
        logoutBtn.style.display = 'none'; // Hide logout button
    }
}

// Modify the auth state change listener
supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
        const { user } = session;
        userData = {
            id: user.id,
            username: user.user_metadata?.full_name || 'Unknown User',
            avatar: user.user_metadata?.avatar_url || 'https://via.placeholder.com/50'
        };
        
        // Update existing reviews with new avatar if they belong to this user
        const { data: existingReviews, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('username', userData.username);
            
        if (!error && existingReviews.length > 0) {
            for (const review of existingReviews) {
                const { error: updateError } = await supabase
                    .from('reviews')
                    .update({ avatar: userData.avatar })
                    .eq('username', userData.username);
                    
                if (updateError) console.error('Error updating avatar:', updateError);
            }
        }
        
        isAuthenticated = true;
        updateUI();
        loadReviews();
    } else if (event === 'SIGNED_OUT') {
        isAuthenticated = false;
        userData = null;
        updateUI();
    }
});

// Add this helper function for date formatting
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

// Modify the loadReviews function to use the new date format
async function loadReviews() {
    const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Error fetching reviews:", error);
        return;
    }

    const reviewsContainer = document.getElementById("reviews-container");
    reviewsContainer.innerHTML = "";
    
    if (data.length === 0) {
        reviewsContainer.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to leave a review!</p>';
        return;
    }

    // Update reviews with current user's avatar if they exist
    if (userData) {
        data.forEach(review => {
            if (review.username === userData.username) {
                review.avatar = userData.avatar;
            }
        });
    }

    data.forEach(review => {
        const reviewCard = document.createElement("div");
        reviewCard.classList.add("review-card");
        
        const fullStars = Math.floor(review.rating);
        const halfStar = review.rating % 1 >= 0.5 ? '½' : '';
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        const stars = '<i class="fas fa-star"></i>'.repeat(fullStars) + 
                     (halfStar ? '<i class="fas fa-star-half-alt"></i>' : '') + 
                     '<i class="far fa-star"></i>'.repeat(emptyStars);
        const reviewText = review.text ? `<p class="review-text">${review.text}</p>` : '';
        
        // Add error handling for avatar loading
        const avatarImg = `<img src="${review.avatar}" class="review-avatar" alt="${review.username}'s avatar" onerror="this.src='https://via.placeholder.com/50'">`;
        
        // Format the date
        const formattedDate = formatDate(review.date);
        
        reviewCard.innerHTML = `
            <div class="review-header">
                ${avatarImg}
                <div class="review-user-info">
                    <h3 class="review-username">${review.username}</h3>
                    <p class="review-date">${formattedDate}</p>
                </div>
            </div>
            <p class="review-rating">${stars} <span class="rating-text">${review.rating}/5</span></p>
            ${reviewText}
        `;
        
        reviewsContainer.appendChild(reviewCard);

        if (userData && review.username === userData.username) {
            userHasReviewed = true;
        }
    });

    if (userHasReviewed) {
        document.getElementById('add-review-btn').disabled = true;
        document.getElementById('add-review-btn').textContent = 'You can only submit one review.';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Event Listeners
    addReviewBtn.addEventListener('click', () => {
        if (userHasReviewed) {
        } else if (isAuthenticated) {
            reviewModal.style.display = 'block';
        } else {
            authModal.style.display = 'block';
        }
    });


    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            reviewModal.style.display = 'none';
            authModal.style.display = 'none';
        });
    });
});

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === reviewModal) {
        reviewModal.style.display = 'none';
    }
    if (event.target === authModal) {
        authModal.style.display = 'none';
    }
});

// Theme toggle
themeSwitch.addEventListener('change', toggleTheme);

// Modify the Discord login handlers to include persistSession
discordLoginBtn.addEventListener('click', async () => {
    await supabase.auth.signInWithOAuth({ 
        provider: 'discord',
        options: { 
            redirectTo: window.location.href,
            persistSession: true // Ensure session persistence
        }
    });
});

authDiscordLoginBtn.addEventListener('click', async () => {
    await supabase.auth.signInWithOAuth({ 
        provider: 'discord',
        options: { 
            redirectTo: window.location.href,
            persistSession: true // Ensure session persistence
        }
    });
});

// Modify the logout handler to properly clear the session
logoutBtn.addEventListener('click', async () => {
    try {
        await supabase.auth.signOut();
        isAuthenticated = false;
        userData = null;
        updateUI();
        loadReviews(); // Reload reviews to update UI
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

// Modify the review submission to use today's date in the correct format
reviewForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    if (!isAuthenticated) {
        authModal.style.display = 'block';
        return;
    }

    // Get the latest user data before submitting
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!userError && user) {
        userData = {
            id: user.id,
            username: user.user_metadata?.full_name || 'Unknown User',
            avatar: user.user_metadata?.avatar_url || 'https://via.placeholder.com/50'
        };
    }

    const ratingElement = document.querySelector('input[name="rating"]:checked');
    const reviewText = document.getElementById('review-text').value.trim();

    if (!ratingElement) {
        alert('Please select a rating.');
        return;
    }

    const rating = parseInt(ratingElement.value);
    const today = new Date().toISOString().split('T')[0]; // Keep the ISO format for storage

    const { error } = await supabase.from("reviews").insert([
        {
            username: userData.username,
            avatar: userData.avatar,
            text: reviewText,
            rating: rating,
            date: today
        }
    ]);

    if (error) {
        console.error("Error posting review:", error);
        alert('Failed to submit review. Please try again.');
    } else {
        reviewModal.style.display = 'none';
        reviewForm.reset();
        loadReviews();
    }
});

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    await checkAuth(); // Wait for auth check to complete
    initTheme();
    loadReviews();
});

// Theme Management
function initTheme() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode'); // Apply dark mode to body
        themeSwitch.checked = false;  // Switch should be OFF if dark mode is applied
    } else {
        document.body.classList.remove('dark-mode'); // Remove dark mode
        themeSwitch.checked = true;  // Switch should be ON if light mode is applied
    }
}

// Correct the theme toggle behavior with inverted logic
function toggleTheme() {
    if (themeSwitch.checked) {
        // If the switch is ON (which means it's light mode)
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    } else {
        // If the switch is OFF (which means it's dark mode)
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    }
}

// Theme toggle listener
themeSwitch.addEventListener('change', toggleTheme);

