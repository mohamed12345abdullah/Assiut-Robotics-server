document.getElementById('evaluationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('memberName').value;
    const committee = document.getElementById('committee').value;
    const role = document.getElementById('role').value;
    const tasksDeadline = parseInt(document.getElementById('tasksDeadline').value);
    const behavior = parseInt(document.getElementById('behavior').value);
    const groupInteraction = parseInt(document.getElementById('groupInteraction').value);
    const technicalPerformance = parseInt(document.getElementById('technicalPerformance').value);
    const recipientEmail = document.getElementById('recipientEmail').value;

    // Update preview
    document.getElementById('preview-name').textContent = name;
    document.getElementById('preview-committee').textContent = committee;
    document.getElementById('preview-role').textContent = role;

    // Update progress circles
    updateProgressCircle('tasks-progress', tasksDeadline);
    updateProgressCircle('behavior-progress', behavior);
    updateProgressCircle('interaction-progress', groupInteraction);

    // Update technical performance gauge
    document.getElementById('technical-value').textContent = `${technicalPerformance}%`;

    // Calculate and update total evaluation
    const total = Math.round((tasksDeadline + behavior + groupInteraction + technicalPerformance) / 4);
    document.getElementById('total-value').textContent = `${total}%`;

    // Show report preview
    document.getElementById('reportPreview').classList.remove('hidden');

    // Prepare email template
    const emailTemplate = document.createElement('iframe');
    emailTemplate.style.display = 'none';
    document.body.appendChild(emailTemplate);
    
    // Load the email template and update its content
    fetch('email-template.html')
        .then(response => response.text())
        .then(html => {
            // Replace placeholder values with actual data
            html = html.replace('Afnan Zakaria', name)
                      .replace('Media - design', committee)
                      .replace('Member', role);
            
            emailTemplate.contentDocument.write(html);
            
            // Here you would typically send this HTML along with other data to your backend
            const reportData = {
                name,
                committee,
                role,
                tasksDeadline,
                behavior,
                groupInteraction,
                technicalPerformance,
                total,
                recipientEmail,
                emailHtml: html
            };

            console.log('Report data to be sent:', reportData);
        });
});

function updateProgressCircle(elementId, percentage) {
    const circle = document.getElementById(elementId);
    const circumference = 2 * Math.PI * 60; // radius = 60
    const offset = circumference - (percentage / 100) * circumference;
    
    // Remove existing SVG if it exists
    const existingSvg = circle.querySelector('svg');
    if (existingSvg) {
        existingSvg.remove();
    }

    // Create new SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '120');
    svg.setAttribute('height', '120');
    svg.style.transform = 'rotate(-90deg)';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';

    const circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle1.setAttribute('cx', '60');
    circle1.setAttribute('cy', '60');
    circle1.setAttribute('r', '54');
    circle1.setAttribute('stroke', '#00A7E1');
    circle1.setAttribute('stroke-width', '12');
    circle1.setAttribute('fill', 'none');
    circle1.style.strokeDasharray = circumference;
    circle1.style.strokeDashoffset = offset;

    svg.appendChild(circle1);
    circle.appendChild(svg);

    // Add percentage text
    const text = document.createElement('div');
    text.style.position = 'absolute';
    text.style.top = '50%';
    text.style.left = '50%';
    text.style.transform = 'translate(-50%, -50%)';
    text.style.fontSize = '24px';
    text.style.fontWeight = 'bold';
    text.style.color = '#00A7E1';
    text.textContent = `${percentage}%`;

    circle.appendChild(text);
}