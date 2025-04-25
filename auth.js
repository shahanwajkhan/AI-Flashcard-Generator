// User data storage
let users = [
    {
        name: "Shahanwaj Khan",
        username: "skhan425",
        email: "skhan425@gmail.com",
        photo: "https://static.vecteezy.com/system/resources/previews/024/354/252/non_2x/businessman-isolated-illustration-ai-generative-free-photo.jpg",
        password: "pass@123",
        flashcards: []
    }
];

let currentUser = null;

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token && !window.location.href.includes('index.html') && !window.location.href.includes('signup.html')) {
        window.location.href = 'index.html';
    }
    
    if (token) {
        currentUser = JSON.parse(localStorage.getItem('userData'));
        updateUserProfile();
    }
}

// Update user profile in UI
function updateUserProfile() {
    if (currentUser) {
        const profilePic = document.getElementById('userProfilePic');
        const userName = document.getElementById('userDisplayName');
        const userEmail = document.getElementById('userEmail');
        
        if (profilePic) profilePic.src = currentUser.photo || 'https://static.vecteezy.com/system/resources/previews/024/354/252/non_2x/businessman-isolated-illustration-ai-generative-free-photo.jpg';
        if (userName) userName.textContent = currentUser.name;
        if (userEmail) userEmail.textContent = currentUser.email;
    }
}

// Login function
function login(event) {
    if (event) event.preventDefault();
    
    const identifier = document.getElementById('loginIdentifier').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Find user by username or email
    const user = users.find(u => (u.username === identifier || u.email === identifier) && u.password === password);
    
    if (user) {
        // Set current user
        currentUser = user;
        
        // Store auth token and user data
        localStorage.setItem('authToken', 'loggedIn');
        localStorage.setItem('userData', JSON.stringify(user));
        
        if (rememberMe) {
            localStorage.setItem('rememberedUser', identifier);
            localStorage.setItem('rememberedPassword', password);
        } else {
            localStorage.removeItem('rememberedUser');
            localStorage.removeItem('rememberedPassword');
        }
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid username/email or password');
    }
}

// Signup function
async function signup(event) {
    if (event) event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const photoFile = document.getElementById('signupPhoto').files[0];
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    // Check if username or email already exists
    const userExists = users.some(u => u.username === username || u.email === email);
    if (userExists) {
        alert('Username or email already exists');
        return;
    }
    
    try {
        // Process the photo file if one was selected
        let photoUrl = 'https://static.vecteezy.com/system/resources/previews/024/354/252/non_2x/businessman-isolated-illustration-ai-generative-free-photo.jpg';
        
        if (photoFile) {
            // Convert the file to base64
            photoUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsDataURL(photoFile);
            });
        }
        
        // Create new user
        const newUser = {
            name,
            username,
            email,
            photo: photoUrl,
            password,
            flashcards: []
        };
        
        // Add to users array
        users.push(newUser);
        
        // Set as current user and log in
        currentUser = newUser;
        localStorage.setItem('authToken', 'loggedIn');
        localStorage.setItem('userData', JSON.stringify(newUser));
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Error during signup:', error);
        alert('Failed to process profile picture. Please try again.');
    }
}

// Logout function
function logout() {
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
}

// Toggle password visibility
function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Show forgot password modal
function showForgotPassword() {
    const modal = document.getElementById('forgotPasswordModal');
    modal.style.display = 'block';
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

// Change password
function changePassword(event) {
    if (event) event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    // Validate current password
    if (currentUser.password !== currentPassword) {
        alert('Current password is incorrect');
        return;
    }
    
    // Validate new passwords match
    if (newPassword !== confirmNewPassword) {
        alert('New passwords do not match');
        return;
    }
    
    // Update password
    currentUser.password = newPassword;
    
    // Update in users array
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
    }
    
    // Update localStorage
    localStorage.setItem('userData', JSON.stringify(currentUser));
    
    // Close modal
    closeModal('changePasswordModal');
    
    // Show success message
    alert('Password updated successfully');
}

// Open change password modal
function openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    modal.style.display = 'block';
}

// Initialize auth
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuth();
    
    // Set up login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }
    
    // Set up change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', changePassword);
    }
    
    // Set up forgot password form
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const email = document.getElementById('resetEmail').value;
            alert(`Password reset link sent to ${email}`);
            closeModal('forgotPasswordModal');
        });
    }
    
    // Check for remembered login
    const rememberedUser = localStorage.getItem('rememberedUser');
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    if (rememberedUser && rememberedPassword) {
        const loginIdentifier = document.getElementById('loginIdentifier');
        const loginPassword = document.getElementById('loginPassword');
        const rememberMe = document.getElementById('rememberMe');
        
        if (loginIdentifier && loginPassword && rememberMe) {
            loginIdentifier.value = rememberedUser;
            loginPassword.value = rememberedPassword;
            rememberMe.checked = true;
        }
    }
});