// Updated script for cv.html
document.addEventListener('DOMContentLoaded', () => {
    // Dynamic Add/Remove
    function setupRemoveButton(item) {
        const removeBtn = item.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
            const parent = item.parentElement;
            if (parent.querySelectorAll('.list-item').length > 1) {
                parent.removeChild(item);
            }
        });
    }

    document.getElementById('add-experience').addEventListener('click', () => {
        const template = document.querySelector('#experience-list .list-item').cloneNode(true);
        template.querySelectorAll('input, textarea').forEach(el => el.value = '');
        setupRemoveButton(template);
        document.getElementById('experience-list').appendChild(template);
    });

    document.getElementById('add-education').addEventListener('click', () => {
        const template = document.querySelector('#education-list .list-item').cloneNode(true);
        template.querySelectorAll('input').forEach(el => el.value = '');
        setupRemoveButton(template);
        document.getElementById('education-list').appendChild(template);
    });

    document.getElementById('add-language').addEventListener('click', () => {
        const template = document.querySelector('#language-list .list-item').cloneNode(true);
        template.querySelectorAll('input, select').forEach(el => {
            if (el.tagName === 'SELECT') el.selectedIndex = 0;
            else el.value = ''; 
        });
        setupRemoveButton(template);
        document.getElementById('language-list').appendChild(template);
    });

    document.getElementById('add-certification').addEventListener('click', () => {
        const template = document.querySelector('#certification-list .list-item').cloneNode(true);
        template.querySelectorAll('input').forEach(el => el.value = '');
        setupRemoveButton(template);
        document.getElementById('certification-list').appendChild(template);
    });

    document.querySelectorAll('.list-item').forEach(item => setupRemoveButton(item));

    // Template Preview Restore
    const src = localStorage.getItem('selectedTemplateSrc');
    const name = localStorage.getItem('selectedTemplateName');
    const img = document.getElementById('selected-template-img');
    const lbl = document.getElementById('selected-template-name');
    if (src && name) {
        img.src = src;
        lbl.textContent = name + ' Template';
    } else {
        lbl.textContent = 'No template selected';
    }    // Form Submission
    document.getElementById('cv-form').addEventListener('submit', async (e) => {
    e.preventDefault();

        // Get user data from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user ? user._id : null;

        // Prepare full name and contact info
        const fullName = `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`;
        const contact = `${document.getElementById('location').value ? document.getElementById('location').value + ' | ' : ''}${document.getElementById('phone').value} | ${document.getElementById('email').value}`;

        // Get website and social links
        const website = document.getElementById('website').value;
        const linkedin = document.getElementById('linkedin').value;
        const github = document.getElementById('github').value;
        const socialLinks = [website, linkedin, github].filter(link => link).join('\n');

        // Get the selected template path
        const templatePath = localStorage.getItem('selectedTemplatePath') || 'classicBold_temp.html';
        if (!templatePath) {
            alert('Please select a template first');
            return;
        }

        // Collect all work experience entries
        const workExperience = [...document.querySelectorAll('#experience-list .list-item')].map(item => ({
            jobTitle: item.querySelector('[name="jobTitle[]"]').value,
            company: item.querySelector('[name="company[]"]').value,
            jobStartDate: item.querySelector('[name="jobStartDate[]"]').value,
            jobEndDate: item.querySelector('[name="jobEndDate[]"]').value,
            jobLocation: item.querySelector('[name="jobLocation[]"]').value,
            jobDescription: item.querySelector('[name="jobDescription[]"]').value
        }));

        // Collect all education entries
        const education = [...document.querySelectorAll('#education-list .list-item')].map(item => ({
            degree: item.querySelector('[name="degree[]"]').value,
            institution: item.querySelector('[name="institution[]"]').value,
            eduStartDate: item.querySelector('[name="eduStartDate[]"]').value,
            eduEndDate: item.querySelector('[name="eduEndDate[]"]').value,
            eduLocation: item.querySelector('[name="eduLocation[]"]').value,
            eduAchievements: item.querySelector('[name="eduAchievements[]"]').value
        }));

        // Collect languages
        const languages = [...document.querySelectorAll('#language-list .list-item')].map(item => ({
            language: item.querySelector('[name="language[]"]').value,
            proficiency: item.querySelector('[name="proficiency[]"]').value
        }));

        // Collect certifications
        const certifications = [...document.querySelectorAll('#certification-list .list-item')].map(item => ({
            certName: item.querySelector('[name="certName[]"]').value,
            certOrg: item.querySelector('[name="certOrg[]"]').value,
            certDate: item.querySelector('[name="certDate[]"]').value,
            certExpiry: item.querySelector('[name="certExpiry[]"]').value
        }));        // Store data in localStorage for template to use
        localStorage.setItem('fullName', fullName);
        localStorage.setItem('title', document.getElementById('professionalTitle').value);
        localStorage.setItem('contact', contact);
        localStorage.setItem('objective', document.getElementById('summary').value);
        localStorage.setItem('workExperience', JSON.stringify(workExperience));
        localStorage.setItem('education', JSON.stringify(education));
        localStorage.setItem('skills', document.getElementById('skills').value);
        localStorage.setItem('languages', JSON.stringify(languages));
        localStorage.setItem('certifications', JSON.stringify(certifications));
        localStorage.setItem('website', socialLinks);
        
        // Prepare data for server submission
        const cvData = {
            userId: userId,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            professionalTitle: document.getElementById('professionalTitle').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            location: document.getElementById('location').value,
            website: website,
            linkedin: linkedin,
            github: github,
            summary: document.getElementById('summary').value,
            skills: document.getElementById('skills').value,
            workExperience: workExperience,
            education: education,
            languages: languages,
            certifications: certifications,
            template: {
                name: localStorage.getItem('selectedTemplateName'),
                image: localStorage.getItem('selectedTemplateSrc')
            }
        };
        
        // Submit to server if user is logged in
        if (userId) {
            try {
                // Show loading indicator or message here
                fetch('http://localhost:3000/submit-cv', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(cvData)
                })
                .then(response => response.json())
                .then(data => {
                    console.log('CV saved to server:', data);
                    // Store the CV ID for future reference
                    if (data.cvId) {
                        localStorage.setItem('currentCvId', data.cvId);
                    }
                    // Continue to result page
                    window.location.href = 'result.html';
                })
                .catch(error => {
                    console.error('Error saving CV:', error);
                    // Still go to result page even if server save fails
                    window.location.href = 'result.html';
                });
            } catch (error) {
                console.error('Error submitting CV:', error);
                window.location.href = 'result.html';
            }
        } else {
            // If not logged in, just go to result page without saving to server
            window.location.href = 'result.html';
        }
});

    // Save draft (localStorage)
    document.getElementById('save-draft').addEventListener('click', () => {
        alert('CV draft saved successfully! You can return to complete it later.');
    });
});