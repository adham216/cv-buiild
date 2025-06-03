// Dashboard JavaScript - Fetch and display user data
document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    const userString = localStorage.getItem('user');
    
    if (!userString) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userString);
    
    // Update basic user information in the UI
    document.getElementById('user-name').textContent = user.firstName || user.email;
    document.getElementById('sidebar-name').textContent = user.firstName + ' ' + (user.lastName || '');
    document.getElementById('sidebar-email').textContent = user.email;
    
    // Fetch user stats from the server
    try {
        const response = await fetch(`http://localhost:3000/user-stats/${user._id}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const userStats = await response.json();
            updateDashboardStats(userStats);
            displayUserCVs(userStats.cvHistory);
            displayUserPortfolios(userStats.portfolioHistory);
        } else {
            console.error('Failed to fetch user stats:', await response.text());
            showError('Failed to load your data. Please try refreshing the page.');
        }
        
        // Fetch user PDFs
        const pdfResponse = await fetch(`http://localhost:3000/user-pdfs/${user._id}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (pdfResponse.ok) {
            const pdfData = await pdfResponse.json();
            displayUserPDFs(pdfData.pdfs);
        } else {
            console.error('Failed to fetch PDFs:', await pdfResponse.text());
        }
        
    } catch (err) {
        console.error('Error fetching user data:', err);
        showError('Failed to connect to the server. Please check your connection and try again.');
    }
    
    // Set up logout button
    document.getElementById('logout-btn').addEventListener('click', async function(e) {
        e.preventDefault();
        
        try {
            const response = await fetch('http://localhost:3000/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Regardless of server response, clear local storage
            localStorage.removeItem('user');
            
            // Redirect to home page
            window.location.href = 'index.html';
        } catch (err) {
            console.error('Logout error:', err);
            // Still clear localStorage and redirect even if there's an error
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        }
    });
});

// Update dashboard stats
function updateDashboardStats(stats) {
    document.getElementById('resume-count').textContent = stats.cvCount || 0;
    document.getElementById('portfolio-count').textContent = stats.portfolioCount || 0;
    
    // Format last update date
    const lastUpdate = stats.updatedAt ? new Date(stats.updatedAt) : null;
    document.getElementById('last-update').textContent = lastUpdate 
        ? lastUpdate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Never';
    
    // Show empty states if needed
    if (stats.cvCount === 0) {
        document.getElementById('no-resumes').style.display = 'block';
    } else {
        document.getElementById('no-resumes').style.display = 'none';
    }
    
    if (stats.portfolioCount === 0) {
        document.getElementById('no-portfolios').style.display = 'block';
    } else {
        document.getElementById('no-portfolios').style.display = 'none';
    }
}

// Display user CVs
function displayUserCVs(cvHistory) {
    const resumeGrid = document.getElementById('resume-grid');
    const noResumesEl = document.getElementById('no-resumes');
    
    // Clear any existing items (excluding the empty state)
    Array.from(resumeGrid.children).forEach(child => {
        if (child !== noResumesEl) {
            child.remove();
        }
    });
    
    if (!cvHistory || cvHistory.length === 0) {
        noResumesEl.style.display = 'block';
        return;
    }
    
    noResumesEl.style.display = 'none';
    
    // Add CV items
    cvHistory.forEach(cv => {
        const createdDate = new Date(cv.createdAt || Date.now());
        const formattedDate = createdDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        
        const cvCard = document.createElement('div');
        cvCard.className = 'item-card';
        cvCard.innerHTML = `
            <div class="item-img">
                <img src="${cv.template?.image || 'https://via.placeholder.com/280x200?text=Resume+Preview'}" 
                     alt="Resume Preview">
            </div>
            <div class="item-info">
                <h3>${cv.firstName || ''} ${cv.lastName || ''} - ${cv.professionalTitle || 'Resume'}</h3>
                <div class="item-meta">
                    <span>Created: ${formattedDate}</span>
                </div>
                <div class="item-actions">
                    <a href="result.html?cvId=${cv._id}" class="item-btn">View</a>
                    <a href="#" class="item-btn" onclick="generatePDF('${cv._id}', event)">Download PDF</a>
                </div>
            </div>
        `;
        
        resumeGrid.appendChild(cvCard);
    });
}

// Display user portfolios
function displayUserPortfolios(portfolioHistory) {
    const portfolioGrid = document.getElementById('portfolio-grid');
    const noPortfoliosEl = document.getElementById('no-portfolios');
    
    // Clear any existing items (excluding the empty state)
    Array.from(portfolioGrid.children).forEach(child => {
        if (child !== noPortfoliosEl) {
            child.remove();
        }
    });
    
    if (!portfolioHistory || portfolioHistory.length === 0) {
        noPortfoliosEl.style.display = 'block';
        return;
    }
    
    noPortfoliosEl.style.display = 'none';
    
    // Add portfolio items
    portfolioHistory.forEach(portfolio => {
        const createdDate = new Date(portfolio.createdAt || Date.now());
        const formattedDate = createdDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        
        const portfolioCard = document.createElement('div');
        portfolioCard.className = 'item-card';
        portfolioCard.innerHTML = `
            <div class="item-img">
                <img src="${portfolio.template?.image || 'https://via.placeholder.com/280x200?text=Portfolio+Preview'}" 
                     alt="Portfolio Preview">
            </div>
            <div class="item-info">
                <h3>${portfolio.personalInfo?.fullName || 'Portfolio'}</h3>
                <div class="item-meta">
                    <span>Created: ${formattedDate}</span>
                </div>
                <div class="item-actions">
                    <a href="portfolio_view.html?id=${portfolio._id}" class="item-btn">View</a>
                    <a href="#" class="item-btn">Share</a>
                </div>
            </div>
        `;
        
        portfolioGrid.appendChild(portfolioCard);
    });
}

// Display user PDFs
function displayUserPDFs(pdfs) {
    // This function can add PDF downloads to the CV cards
    // We'll just log the data for now
    console.log('User PDFs:', pdfs);
    
    // We could enhance the CV display with PDF links here
}

// Generate PDF function
function generatePDF(cvId, event) {
    if (event) {
        event.preventDefault(); // Prevent default link behavior
    }
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    
    // Set up the data for PDF generation
    const data = {
        userId: user._id,
        cvId: cvId
        // The server will fetch the CV data by ID
    };
    
    // Create a form to submit the request (allows file download)
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'http://localhost:3000/generate-pdf';
    form.target = '_blank'; // Open in new tab
    
    // Add data as hidden fields
    for (const key in data) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data[key];
        form.appendChild(input);
    }
    
    // Submit the form
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
    
    // After a short delay, refresh user stats to show the new PDF
    setTimeout(async () => {
        try {
            const response = await fetch(`http://localhost:3000/user-stats/${user._id}`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const userStats = await response.json();
                updateDashboardStats(userStats);
            }
        } catch (error) {
            console.error('Error refreshing user stats:', error);
        }
    }, 3000); // Give the server 3 seconds to process and save the PDF
}

// Show error message
function showError(message) {
    // You could create a toast/notification component here
    alert(message);
}
