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
const mobileMenuBtn = document.querySelector('.mobile-menu');
const mobileNav = document.getElementById('mobileNav');
const mobileCloseBtn = document.querySelector('#mobileNav span');

// State
let isAuthenticated = false;
let userData = null;
let userHasReviewed = false;

// Ensure the user-avatars bucket exists
async function ensureAvatarBucketExists() {
    try {
        // First check if the bucket exists by listing buckets
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
            console.error('Error listing buckets:', listError);
            return false;
        }
        
        // Check if user-avatars bucket exists
        const bucketExists = buckets.some(bucket => bucket.name === 'user-avatars');
        
        if (!bucketExists) {
            // Create the bucket if it doesn't exist
            const { data, error: createError } = await supabase.storage.createBucket('user-avatars', {
                public: true, // Make the bucket public so avatars are accessible
                fileSizeLimit: 1024 * 1024 * 2 // 2MB size limit
            });
            
            if (createError) {
                console.error('Error creating user-avatars bucket:', createError);
                return false;
            }
            
            console.log('Created user-avatars bucket successfully');
        }
        
        return true;
    } catch (error) {
        console.error('Error ensuring bucket exists:', error);
        return false;
    }
}

// Function to migrate existing reviews to use stored avatars
async function migrateExistingAvatars() {
    try {
        // Add a small notification to indicate migration process
        const notification = document.createElement('div');
        notification.className = 'migration-notification';
        notification.innerHTML = `
            <div class="migration-content">
                <i class="fas fa-sync fa-spin"></i>
                <span>Optimizing avatar storage...</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        // First ensure the bucket exists
        const bucketReady = await ensureAvatarBucketExists();
        if (!bucketReady) {
            console.warn('Cannot migrate avatars: avatar bucket is not available');
            notification.remove();
            return;
        }
        
        // Get all reviews
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*');
            
        if (error) {
            console.error('Error fetching reviews for migration:', error);
            notification.remove();
            return;
        }
        
        // Update notification with count
        const reviewsToProcess = reviews.filter(review => 
            review.avatar && 
            review.avatar.startsWith('http') && 
            !review.avatar.includes('user-avatars')
        ).length;
        
        if (reviewsToProcess === 0) {
            // No avatars to migrate
            notification.remove();
            return;
        }
        
        notification.querySelector('span').textContent = 
            `Optimizing ${reviewsToProcess} avatar${reviewsToProcess !== 1 ? 's' : ''}...`;
        
        // Keep track of already processed usernames to avoid duplicate work
        const processedUsernames = new Set();
        let migratedCount = 0;
        
        for (const review of reviews) {
            // Skip if we've already processed this username or if the avatar URL is already from our storage
            if (processedUsernames.has(review.username) || 
                (review.avatar && review.avatar.includes('user-avatars'))) {
                continue;
            }
            
            // Store original avatar URL
            const originalAvatar = review.avatar;
            
            if (!originalAvatar || !originalAvatar.startsWith('http')) {
                continue; // Skip if no valid avatar URL
            }
            
            try {
                // Generate a unique ID for this user based on username (since we don't have user ID)
                const userId = `migrated_${btoa(review.username).replace(/[=+/]/g, '')}`;
                
                // Upload the avatar
                const storedAvatarUrl = await uploadAvatarToStorage(userId, originalAvatar);
                
                if (storedAvatarUrl !== originalAvatar) {
                    // Update all reviews by this user with the new avatar URL
                    const { error: updateError } = await supabase
                        .from('reviews')
                        .update({ avatar: storedAvatarUrl })
                        .eq('username', review.username);
                        
                    if (updateError) {
                        console.error(`Error updating avatar for ${review.username}:`, updateError);
                    } else {
                        console.log(`Successfully migrated avatar for ${review.username}`);
                        processedUsernames.add(review.username);
                        migratedCount++;
                        
                        // Update notification
                        notification.querySelector('span').textContent = 
                            `Optimized ${migratedCount} of ${reviewsToProcess} avatar${reviewsToProcess !== 1 ? 's' : ''}...`;
                    }
                }
            } catch (e) {
                console.error(`Error migrating avatar for ${review.username}:`, e);
            }
        }
        
        // Update notification and remove after a delay
        notification.innerHTML = `
            <div class="migration-content">
                <i class="fas fa-check"></i>
                <span>Avatars optimized successfully!</span>
            </div>
        `;
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 2000);
        
        // Reload reviews to show the updated avatars
        loadReviews();
        
        console.log('Avatar migration completed');
    } catch (error) {
        console.error('Error in avatar migration process:', error);
        // Remove notification if there was an error
        document.querySelector('.migration-notification')?.remove();
    }
}

// Helper function to fetch and upload Discord avatar to Supabase storage
async function uploadAvatarToStorage(userId, avatarUrl) {
    try {
        // Ensure the bucket exists
        const bucketReady = await ensureAvatarBucketExists();
        if (!bucketReady) {
            console.warn('Avatar bucket is not available, using original URL');
            return avatarUrl;
        }
        
        // Generate a unique filename for the avatar
        const fileName = `avatars/${userId}_${Date.now()}.png`;
        
        // Check if the URL is a Discord CDN URL
        const isDiscordCDN = avatarUrl.includes('cdn.discordapp.com');
        
        // Add cache busting for Discord CDN URLs
        const fetchUrl = isDiscordCDN ? `${avatarUrl}?size=256&t=${Date.now()}` : avatarUrl;
        
        // Fetch the avatar image from Discord with proper cache headers
        try {
            const response = await fetch(fetchUrl, {
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            // Check if the fetch was successful
            if (!response.ok) {
                console.error('Failed to fetch avatar:', response.status, response.statusText);
                return avatarUrl; // Fallback to original URL
            }
            
            const blob = await response.blob();
            
            // Verify we got a valid image
            if (!blob.type.startsWith('image/')) {
                console.error('Fetched content is not an image:', blob.type);
                return avatarUrl; // Fallback to original URL
            }
            
            // Upload the image to Supabase Storage
            const { data, error } = await supabase.storage
                .from('user-avatars')
                .upload(fileName, blob, {
                    contentType: 'image/png',
                    upsert: true,
                    cacheControl: '3600' // 1 hour cache
                });
            
            if (error) {
                console.error('Error uploading avatar:', error);
                return avatarUrl; // Fallback to original URL if upload fails
            }
            
            // Get the public URL for the uploaded image
            const { data: { publicUrl } } = supabase.storage
                .from('user-avatars')
                .getPublicUrl(fileName);
                
            console.log('Successfully uploaded avatar to:', publicUrl);
            
            // Add a cache bust parameter to enforce fresh loading
            return `${publicUrl}?t=${Date.now()}`;
        } catch (fetchError) {
            console.error('Error fetching avatar:', fetchError);
            return avatarUrl; // Fallback to original URL
        }
    } catch (error) {
        console.error('Error processing avatar:', error);
        return avatarUrl; // Fallback to original URL if process fails
    }
}

// Modified checkAuth function to handle avatar storage
async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error checking auth status:', error);
        return;
    }
    
    if (session) {
        const { user } = session;
        const discordAvatarUrl = user.user_metadata?.avatar_url || 'https://via.placeholder.com/50';
        
        // Upload the avatar to storage and get the stored URL
        const storedAvatarUrl = await uploadAvatarToStorage(user.id, discordAvatarUrl);
        
        isAuthenticated = true;
        userData = {
            id: user.id,
            username: user.user_metadata?.full_name || 'Unknown User',
            avatar: storedAvatarUrl,
            originalAvatar: discordAvatarUrl
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

// Modified auth state change listener to handle avatar storage
supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
        const { user } = session;
        const discordAvatarUrl = user.user_metadata?.avatar_url || 'https://via.placeholder.com/50';
        
        // Upload the avatar to storage and get the stored URL
        const storedAvatarUrl = await uploadAvatarToStorage(user.id, discordAvatarUrl);
        
        userData = {
            id: user.id,
            username: user.user_metadata?.full_name || 'Unknown User',
            avatar: storedAvatarUrl,
            originalAvatar: discordAvatarUrl
        };
        
        // Update existing reviews with new stored avatar if they belong to this user
        const { data: existingReviews, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('username', userData.username);
            
        if (!error && existingReviews.length > 0) {
            for (const review of existingReviews) {
                const { error: updateError } = await supabase
                    .from('reviews')
                    .update({ avatar: storedAvatarUrl })
                    .eq('id', review.id);
                    
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

// Modify the loadReviews function to handle reviews without valid avatar URLs
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
            if (review.username === userData.username || 
                (userData.discord_id && review.discord_id === userData.discord_id)) {
                review.avatar = userData.avatar;
            }
        });
    }

    // Flag to track if the current user has already submitted a review
    let currentUserHasReviewed = false;

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
        
        // Enhanced avatar handling with fallback and error handling
        const defaultAvatar = 'https://via.placeholder.com/50';
        let avatarUrl = defaultAvatar;
        
        if (review.avatar) {
            // Add cache-busting parameter if not already present
            avatarUrl = review.avatar.includes('?') ? review.avatar : `${review.avatar}?t=${Date.now()}`;
        }
        
        // Add error handling for avatar loading
        const avatarImg = `<img src="${avatarUrl}" class="review-avatar" alt="${review.username}'s avatar" 
                           onerror="this.src='${defaultAvatar}'; this.onerror=null;">`;
        
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

        // Check if this review belongs to the current user
        if (userData && (review.username === userData.username || 
            (userData.discord_id && review.discord_id === userData.discord_id))) {
            currentUserHasReviewed = true;
        }
    });

    // Update the global state and UI
    userHasReviewed = currentUserHasReviewed;
    
    // Update the Add Review button state
    const addReviewBtn = document.getElementById('add-review-btn');
    if (userHasReviewed) {
        addReviewBtn.disabled = true;
        addReviewBtn.textContent = 'You can only submit one review.';
    } else {
        addReviewBtn.disabled = false;
        addReviewBtn.textContent = 'Add Review';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already authenticated
    checkAuth();
    
    // Mobile menu setup
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
    
    // Theme toggle setup
    if (themeSwitch) {
        themeSwitch.addEventListener('change', toggleTheme);
        initTheme();
    }
    
    // Load reviews
    loadReviews();
    
    // Migrate existing avatars if needed
    migrateExistingAvatars();
    
    // Open review modal when Add Review button is clicked
    addReviewBtn?.addEventListener('click', async function() {
        if (!isAuthenticated) {
            authModal.style.display = 'block';
        } else {
            // Check if user has already submitted a review
            await checkUserReviewStatus();
            
            if (userHasReviewed) {
                document.getElementById('review-restriction-modal').style.display = 'block';
            } else {
                reviewModal.style.display = 'block';
            }
        }
    });

    // Close modals when close button is clicked
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Close modals when clicking outside of modal content
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Login with Discord
    discordLoginBtn?.addEventListener('click', loginWithDiscord);
    authDiscordLoginBtn?.addEventListener('click', loginWithDiscord);

    // Logout
    logoutBtn?.addEventListener('click', logout);

    // Submit review
    reviewForm?.addEventListener('submit', submitReview);
});

// Theme Management - Updated for compatibility with the main site
function initTheme() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark'); // Add dark class for main site compatibility
        themeSwitch.checked = false;  // Switch should be OFF if dark mode is applied
    } else {
        document.body.classList.remove('dark'); // Remove dark class
        themeSwitch.checked = true;  // Switch should be ON if light mode is applied
    }
}

// Theme toggle function with correct logic
function toggleTheme() {
    if (themeSwitch.checked) {
        // If the switch is ON (which means it's light mode)
        document.body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        // If the switch is OFF (which means it's dark mode)
        document.body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

// Login with Discord
async function loginWithDiscord() {
    await supabase.auth.signInWithOAuth({ 
        provider: 'discord',
        options: { 
            redirectTo: window.location.href,
            persistSession: true // Ensure session persistence
        }
    });
}

// Logout function
async function logout() {
    try {
        await supabase.auth.signOut();
        isAuthenticated = false;
        userData = null;
        updateUI();
        loadReviews(); // Reload reviews to update UI
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

// Submit review function
async function submitReview(event) {
    event.preventDefault();
    
    if (!isAuthenticated) {
        authModal.style.display = 'block';
        return;
    }

    // Always refresh the user data and avatar before submitting
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            console.error('Error getting current user:', userError);
        } else if (user) {
            const discordAvatarUrl = user.user_metadata?.avatar_url || 'https://via.placeholder.com/50';
            
            // Always upload the current avatar to ensure it's fresh
            const storedAvatarUrl = await uploadAvatarToStorage(user.id, discordAvatarUrl);
            
            // Update user data with fresh avatar
            userData = {
                id: user.id,
                username: user.user_metadata?.full_name || 'Unknown User',
                avatar: storedAvatarUrl,
                originalAvatar: discordAvatarUrl,
                discord_id: user.user_metadata?.provider_id || null
            };
            
            // Update UI with fresh avatar
            if (profilePic) {
                profilePic.src = userData.avatar;
            }
        }
    } catch (refreshError) {
        console.error('Error refreshing user data:', refreshError);
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
            date: today,
            user_id: userData.id, // Add user ID to check for existing reviews
            discord_id: userData.discord_id // Store Discord ID for future reference
        }
    ]);

    if (error) {
        console.error("Error posting review:", error);
        alert('Failed to submit review. Please try again.');
    } else {
        reviewModal.style.display = 'none';
        reviewForm.reset();
        loadReviews();
        userHasReviewed = true; // Update local state
    }
}

// Check if user has already submitted a review
async function checkUserReviewStatus() {
    if (!isAuthenticated || !userData) return false;
    
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('id')
            .eq('user_id', userData.id)
            .limit(1);
            
        if (error) {
            console.error('Error checking user review status:', error);
            return false;
        }
        
        userHasReviewed = data && data.length > 0;
        return userHasReviewed;
    } catch (error) {
        console.error('Error in checkUserReviewStatus:', error);
        return false;
    }
}


