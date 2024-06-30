// script.js
document.getElementById('addSheet').addEventListener('click', addSheet);
document.getElementById('addComponent').addEventListener('click', addComponent);
document.getElementById('inputForm').addEventListener('submit', optimizeLayout);

document.addEventListener('DOMContentLoaded', loadSavedData);

function addSheet(sheetData = {}) {
    const sheetDiv = document.createElement('div');
    sheetDiv.classList.add('segmented-box', 'sheet');
    sheetDiv.innerHTML = `
        <label>Length (mm):</label>
        <input type="number" class="sheetLength" value="${sheetData.length || ''}" required>
        <label>Width (mm):</label>
        <input type="number" class="sheetWidth" value="${sheetData.width || ''}" required>
        <label>Thickness (mm):</label>
        <input type="number" class="sheetThickness" value="${sheetData.thickness || ''}" required>
        <button type="button" class="removeSheet">Remove</button>
    `;
    document.getElementById('sheetsContainer').appendChild(sheetDiv);
    sheetDiv.querySelector('.removeSheet').addEventListener('click', () => {
        sheetDiv.remove();
        saveData();
        drawLayouts();
    });
}

function addComponent(componentData = {}) {
    const componentDiv = document.createElement('div');
    componentDiv.classList.add('segmented-box', 'component');
    componentDiv.innerHTML = `
        <label>Length (mm):</label>
        <input type="number" class="compLength" value="${componentData.length || ''}" required>
        <label>Width (mm):</label>
        <input type="number" class="compWidth" value="${componentData.width || ''}" required>
        <button type="button" class="removeComponent">Remove</button>
    `;
    document.getElementById('componentsContainer').appendChild(componentDiv);
    componentDiv.querySelector('.removeComponent').addEventListener('click', () => {
        componentDiv.remove();
        saveData();
        drawLayouts();
    });
}

function optimizeLayout(e) {
    e.preventDefault();
    
    const sheets = Array.from(document.querySelectorAll('.sheet')).map(sheet => ({
        length: parseFloat(sheet.querySelector('.sheetLength').value),
        width: parseFloat(sheet.querySelector('.sheetWidth').value),
        thickness: parseFloat(sheet.querySelector('.sheetThickness').value)
    }));
    
    const components = Array.from(document.querySelectorAll('.component')).map(component => ({
        length: parseFloat(component.querySelector('.compLength').value),
        width: parseFloat(component.querySelector('.compWidth').value)
    }));

    const tolerance = parseFloat(document.getElementById('tolerance').value);

    const optimizedLayouts = optimizeKnapsack(sheets, components, tolerance);
    
    drawLayouts(sheets, components, optimizedLayouts);
    displayResult(optimizedLayouts);

    saveData();
}

function optimizeKnapsack(sheets, components, tolerance) {
    let sheetIndex = 0;
    let x = 0, y = 0;
    let currentRowHeight = 0;

    return components.map(component => {
        let sheet = sheets[sheetIndex];
        
        if (x + component.width + tolerance > sheet.width) {
            x = 0;
            y += currentRowHeight + tolerance;
            currentRowHeight = 0;
        }
        
        if (y + component.length + tolerance > sheet.length) {
            sheetIndex++;
            if (sheetIndex >= sheets.length) {
                alert('Not enough sheet space for all components.');
                return null;
            }
            sheet = sheets[sheetIndex];
            x = 0;
            y = 0;
            currentRowHeight = 0;
        }
        
        const position = { x, y, sheetIndex };
        x += component.width + tolerance;
        currentRowHeight = Math.max(currentRowHeight, component.length + tolerance);
        
        return { ...component, position };
    }).filter(item => item !== null);
}

function drawLayouts(sheets, components, layouts) {
    const canvasContainer = document.getElementById('canvasContainer');
    canvasContainer.innerHTML = '';
    
    sheets.forEach((sheet, sheetIndex) => {
        const canvas = document.createElement('canvas');
        canvasContainer.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        canvas.width = sheet.width;
        canvas.height = sheet.length;
        
        const scale = Math.min(canvas.width / sheet.width, canvas.height / sheet.length);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ccc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        layouts.filter(item => item.position.sheetIndex === sheetIndex).forEach(item => {
            ctx.fillStyle = '#00f';
            ctx.fillRect(item.position.x, item.position.y, item.width, item.length);
            ctx.strokeRect(item.position.x, item.position.y, item.width, item.length);
            
            // Display dimensions
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            const text = `${item.width}mm x ${item.length}mm`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillText(text, item.position.x + (item.width - textWidth) / 2, item.position.y + 12);
        });
        
        // Draw tolerance area
        ctx.fillStyle = 'rgba(255, 165, 0, 0.2)';
        ctx.fillRect(0, 0, sheet.width, sheet.length);
    });
}

function displayResult(layouts) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '<h2>Optimized Layouts</h2>';
    
    layouts.forEach((item, index) => {
        outputDiv.innerHTML += `
            <div>
                Component ${index + 1}: 
                Length: ${item.length} mm, Width: ${item.width} mm,
                Position: (${item.position.x}, ${item.position.y}) on Sheet ${item.position.sheetIndex + 1}
            </div>
        `;
    });
}

function saveData() {
    const sheets = Array.from(document.querySelectorAll('.sheet')).map(sheet => ({
        length: sheet.querySelector('.sheetLength').value,
        width: sheet.querySelector('.sheetWidth').value,
        thickness: sheet.querySelector('.sheetThickness').value
    }));
    
    const components = Array.from(document.querySelectorAll('.component')).map(component => ({
        length: component.querySelector('.compLength').value,
        width: component.querySelector('.compWidth').value
    }));

    const tolerance = document.getElementById('tolerance').value;

    const data = {
        sheets,
        components,
        tolerance
    };

    localStorage.setItem('knapsackData', JSON.stringify(data));
}

function loadSavedData() {
    const data = JSON.parse(localStorage.getItem('knapsackData'));

    if (data) {
        data.sheets.forEach(sheet => addSheet(sheet));
        data.components.forEach(component => addComponent(component));
        document.getElementById('tolerance').value = data.tolerance;
    } else {
        addSheet(); // Add one default sheet
        addComponent(); // Add one default component
    }
}

// Initial remove button event listeners
document.querySelectorAll('.removeComponent').forEach(button => {
    button.addEventListener('click', (e) => {
        e.target.parentElement.remove();
        saveData();
        drawLayouts();
    });
});

document.querySelectorAll('.removeSheet').forEach(button => {
    button.addEventListener('click', (e) => {
        e.target.parentElement.remove();
        saveData();
        drawLayouts();
    });
});

function drawLayouts(sheets, components, layouts) {
    const canvasContainer = document.getElementById('canvasContainer');
    canvasContainer.innerHTML = '';
    
    sheets.forEach((sheet, sheetIndex) => {
        const canvas = document.createElement('canvas');
        canvasContainer.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        canvas.width = sheet.width;
        canvas.height = sheet.length;
        
        const scale = Math.min(canvas.width / sheet.width, canvas.height / sheet.length);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ccc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        layouts.filter(item => item.position.sheetIndex === sheetIndex).forEach(item => {
            ctx.fillStyle = '#00f';
            ctx.fillRect(item.position.x, item.position.y, item.width, item.length);
            ctx.strokeRect(item.position.x, item.position.y, item.width, item.length);
            
            // Display dimensions
            ctx.fillStyle = '#fff'; // White text for contrast
            ctx.font = 'bold 16px Arial'; // Larger and bold font
            const text = `${item.width}mm x ${item.length}mm`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillText(text, item.position.x + (item.width - textWidth) / 2, item.position.y + item.length / 2);
        });
        
        // Draw tolerance area
        ctx.fillStyle = 'rgba(255, 165, 0, 0.2)'; // Orange color for tolerance
        ctx.fillRect(0, 0, sheet.width, sheet.length);
    });
}
