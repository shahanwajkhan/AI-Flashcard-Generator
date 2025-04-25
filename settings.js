document.addEventListener('DOMContentLoaded', function() {
    // Initialize user data
    loadUserData();
    loadPreferences();
    setupEventListeners();
});

function loadUserData() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }

    // Set user information
    document.querySelector('.user-email').textContent = userData.email;
    document.getElementById('userEmail').value = userData.email;
    document.getElementById('username').value = userData.username;

    // Set profile picture if exists
    if (userData.profilePicture) {
        document.getElementById('profilePreview').src = userData.profilePicture;
        document.getElementById('currentProfilePic').src = userData.profilePicture;
    }
}

function loadPreferences() {
    const preferences = JSON.parse(localStorage.getItem('userPreferences')) || {
        defaultFlashcardCount: 10,
        defaultComplexity: 'intermediate'
    };

    document.getElementById('defaultFlashcardCount').value = preferences.defaultFlashcardCount;
    document.getElementById('defaultComplexity').value = preferences.defaultComplexity;
}

function setupEventListeners() {
    // Profile photo upload
    document.getElementById('profilePhotoInput').addEventListener('change', handleProfilePhotoUpload);

    // Password visibility toggle
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function() {
            const input = this.previousElementSibling;
            input.type = input.type === 'password' ? 'text' : 'password';
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

    // Change password form
    document.getElementById('changePasswordForm').addEventListener('submit', handlePasswordChange);

    // Preferences change
    document.getElementById('defaultFlashcardCount').addEventListener('change', savePreferences);
    document.getElementById('defaultComplexity').addEventListener('change', savePreferences);

    // Logout button
    document.querySelector('.btn-logout').addEventListener('click', handleLogout);
}

async function handleProfilePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Please select an image under 5MB');
        return;
    }

    try {
        const base64Image = await convertToBase64(file);
        document.getElementById('profilePreview').src = base64Image;
        document.getElementById('currentProfilePic').src = base64Image;

        // Save to user data
        const userData = JSON.parse(localStorage.getItem('userData'));
        userData.profilePicture = base64Image;
        localStorage.setItem('userData', JSON.stringify(userData));

        showNotification('Profile picture updated successfully', 'success');
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        showNotification('Error updating profile picture', 'error');
    }
}

function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function handlePasswordChange(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate passwords
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 8) {
        showNotification('Password must be at least 8 characters long', 'error');
        return;
    }

    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        
        // In a real application, you would make an API call here
        // For demo purposes, we're just checking against localStorage
        if (userData.password !== currentPassword) {
            showNotification('Current password is incorrect', 'error');
            return;
        }

        // Update password
        userData.password = newPassword;
        localStorage.setItem('userData', JSON.stringify(userData));

        // Clear form
        event.target.reset();
        showNotification('Password updated successfully', 'success');
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Error updating password', 'error');
    }
}

function savePreferences() {
    const preferences = {
        defaultFlashcardCount: document.getElementById('defaultFlashcardCount').value,
        defaultComplexity: document.getElementById('defaultComplexity').value
    };

    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    showNotification('Preferences saved', 'success');
}

function handleLogout() {
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    // Add to document
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
} 