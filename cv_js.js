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
            const src  = localStorage.getItem('selectedTemplateSrc');
            const name = localStorage.getItem('selectedTemplateName');
            const img  = document.getElementById('selected-template-img');
            const lbl  = document.getElementById('selected-template-name');
            if (src && name) {
                img.src = src;
                lbl.textContent = name + ' Template';
            } else {
                lbl.textContent = 'No template selected';
            }
        
            // Form Submission
            document.getElementById('cv-form').addEventListener('submit', async (e) => {
                e.preventDefault();

                // Get user from localStorage
                const user = JSON.parse(localStorage.getItem('user'));

                const data = {
                    userId: user?._id,   // <-- Add this line
                    firstName: document.getElementById('firstName').value,
                    lastName: document.getElementById('lastName').value,
                    professionalTitle: document.getElementById('professionalTitle').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    location: document.getElementById('location').value,
                    website: document.getElementById('website').value,
                    linkedin: document.getElementById('linkedin').value,
                    github: document.getElementById('github').value,
                    summary: document.getElementById('summary').value,
                    skills: document.getElementById('skills').value,
                    workExperience: [...document.querySelectorAll('#experience-list .list-item')].map(item => ({
                        jobTitle: item.querySelector('[name="jobTitle[]"]').value,
                        company: item.querySelector('[name="company[]"]').value,
                        jobStartDate: item.querySelector('[name="jobStartDate[]"]').value,
                        jobEndDate: item.querySelector('[name="jobEndDate[]"]').value,
                        jobLocation: item.querySelector('[name="jobLocation[]"]').value,
                        jobDescription: item.querySelector('[name="jobDescription[]"]').value
                    })),
                    education: [...document.querySelectorAll('#education-list .list-item')].map(item => ({
                        degree: item.querySelector('[name="degree[]"]').value,
                        institution: item.querySelector('[name="institution[]"]').value,
                        eduStartDate: item.querySelector('[name="eduStartDate[]"]').value,
                        eduEndDate: item.querySelector('[name="eduEndDate[]"]').value,
                        eduLocation: item.querySelector('[name="eduLocation[]"]').value,
                        eduAchievements: item.querySelector('[name="eduAchievements[]"]').value
                    })),
                    languages: [...document.querySelectorAll('#language-list .list-item')].map(item => ({
                        language: item.querySelector('[name="language[]"]').value,
                        proficiency: item.querySelector('[name="proficiency[]"]').value
                    })),
                    certifications: [...document.querySelectorAll('#certification-list .list-item')].map(item => ({
                        certName: item.querySelector('[name="certName[]"]').value,
                        certOrg: item.querySelector('[name="certOrg[]"]').value,
                        certDate: item.querySelector('[name="certDate[]"]').value,
                        certExpiry: item.querySelector('[name="certExpiry[]"]').value
                    })),
                    template: {
                        name: localStorage.getItem('selectedTemplateName'),
                        image: localStorage.getItem('selectedTemplateSrc'),
                        path: localStorage.getItem('selectedTemplatePath') || 'creativeEdge_temp.html'
                    }
                };

                
                try {
                    // Store all data in localStorage for the template to use
                    const fullName = `${data.firstName} ${data.lastName}`;
                    const contact = `${data.location ? data.location + ' | ' : ''}${data.phone} | ${data.email}`;
                    const socialLinks = [data.website, data.linkedin, data.github].filter(link => link).join('\n');
                    
                    localStorage.setItem('fullName', fullName);
                    localStorage.setItem('title', data.professionalTitle);
                    localStorage.setItem('objective', data.summary);
                    localStorage.setItem('contact', contact);
                    localStorage.setItem('website', socialLinks);
                    localStorage.setItem('skills', data.skills);
                    localStorage.setItem('workExperience', JSON.stringify(data.workExperience));
                    localStorage.setItem('education', JSON.stringify(data.education));
                    localStorage.setItem('languages', JSON.stringify(data.languages));
                    localStorage.setItem('certifications', JSON.stringify(data.certifications));
                    localStorage.setItem('currentTemplate', data.template.path);
                    
                    // Redirect to result.html
                    window.location.href = 'result.html';
                } catch (error) {
                    console.error('Error saving CV data:', error);
                    alert('Error generating your CV. Please try again.');
                }
                
                // Try the server submission too if available
                try {
                    const response = await fetch('http://localhost:3000/submit-cv', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
            
                    const result = await response.json();
                    console.log(result.message || result.error);
                } catch (error) {
                    console.log('Server submission failed, but local CV generation succeeded.');
                }
            });
        
            // Save draft (localStorage or could be server-side)
            document.getElementById('save-draft').addEventListener('click', () => {
                alert('CV draft saved successfully! You can return to complete it later.');
            });
        });

        document.addEventListener('DOMContentLoaded', function () {
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        const iti = window.intlTelInput(phoneInput, {
            initialCountry: "auto",
            geoIpLookup: function(callback) {
                fetch('https://ipinfo.io/json')
                    .then(resp => resp.json())
                    .then(resp => callback(resp.country ? resp.country : 'us'));
            },
            nationalMode: false, // always require +country
            utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/utils.js" // formatting/validation
        });

        // Add real-time validation
        phoneInput.form.addEventListener('submit', function(e) {
            if (!iti.isValidNumber()) {
                e.preventDefault();
                phoneInput.classList.add('invalid');
                alert("Please enter a valid international phone number.");
            }
        });
    }
});

 
        