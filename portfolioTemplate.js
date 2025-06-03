// This file contains the functions to handle portfolio template images
function updatePortfolioTemplatePreview(templateFile) {
    console.log('Updating template preview for:', templateFile);
    
    // Get references to DOM elements
    const templateNameElement = document.getElementById('selected-template-name');
    const templateDescriptionElement = document.getElementById('template-description');
    const templateInputElement = document.getElementById('selected-template');
    const templateImageElement = document.getElementById('selected-template-img');
    const templateSection = document.getElementById('template-section');
    
    if (!templateNameElement || !templateDescriptionElement || !templateInputElement || !templateImageElement) {
        console.error('Required template elements not found in the DOM');
        return;
    }
    
    // Format the template name for display
    const templateName = templateFile.replace('.html', '').replace('_ptemp', '').replace(/([A-Z])/g, ' $1').trim();
    templateNameElement.textContent = templateName + ' Template';
    
    // Store the actual template filename
    templateInputElement.value = templateFile;
    
    // Set template description based on selected template
    let description = '';
    if (templateFile.includes('ModernDesigner')) {
        description = 'A clean, professional template perfect for designers and creative professionals.';
    } else if (templateFile.includes('VisualShowcase')) {
        description = 'A visually striking template ideal for photographers, artists, and visual portfolios.';
    }
    templateDescriptionElement.textContent = description;
    
    // Set preview image based on template - using same images as in portfolioTemplates.html
    let previewSrc = '';
    if (templateFile.includes('ModernDesigner')) {
        previewSrc = "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80";
    } else if (templateFile.includes('VisualShowcase')) {
        previewSrc = "https://images.unsplash.com/photo-1470058869958-2a77ade41c02?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80";
    }
    
    // Error handler for image loading
    templateImageElement.onerror = function() {
        console.error('Error loading image:', previewSrc);
        this.src = 'https://via.placeholder.com/600x400?text=Template+Preview';
    };
    
    // Set the image source
    if (previewSrc) {
        templateImageElement.src = previewSrc;
    } else {
        templateImageElement.src = 'https://via.placeholder.com/600x400?text=Template+Preview';
    }
    
    // Highlight the selected template section
    templateSection.classList.add('template-selected');
    
    // Save template selection to localStorage
    localStorage.setItem('selectedPortfolioTemplate', templateFile);
    localStorage.setItem('selectedPortfolioTemplateName', templateName);
    
    console.log('Template preview updated successfully');
}

// Initialize the template preview when the page loads
function initializePortfolioTemplatePreview() {
    console.log('Initializing portfolio template preview...');
    
    // Get the template image element
    const templateImageElement = document.getElementById('selected-template-img');
    
    if (templateImageElement) {
        console.log('Template image element found');
        
        // Make sure there's a default image if none is set
        if (!templateImageElement.src || templateImageElement.src === window.location.href) {
            templateImageElement.src = 'https://via.placeholder.com/600x400?text=No+Template+Selected';
            console.log('Set default template image');
        }
        
        // Add an error handler
        templateImageElement.onerror = function() {
            console.error('Error loading template image, using fallback');
            this.src = 'https://via.placeholder.com/600x400?text=Template+Preview';
        };
    } else {
        console.error('Template image element not found in the DOM!');
        return;
    }
    
    // Check for template in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const templateFile = urlParams.get('template');
    
    if (templateFile) {
        console.log('Found template in URL parameters:', templateFile);
        updatePortfolioTemplatePreview(templateFile);
    } else {
        // Check for template in localStorage
        const savedTemplate = localStorage.getItem('selectedPortfolioTemplate');
        if (savedTemplate) {
            console.log('Found template in localStorage:', savedTemplate);
            updatePortfolioTemplatePreview(savedTemplate);
        } else {
            console.log('No template selected, using default view');
        }
    }
}
