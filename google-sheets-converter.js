/**
 * Google Sheets to JSON Converter
 * This script fetches data from a Google Sheet and converts it to products.json
 */

// Instructions for setup:
// 1. Create a Google Sheet with these columns (in this exact order):
//    A: id, B: name, C: description, D: originalPrice, E: salePrice, 
//    F: store, G: category, H: image, I: affiliateLink

// 2. Make the sheet public or get a shareable link
// 3. Replace the SHEET_ID below with your Google Sheet ID
// 4. Run this script to update your products.json

const GOOGLE_SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // Replace with your sheet ID
const SHEET_NAME = 'Sheet1'; // Change if your sheet has a different name

async function fetchGoogleSheetData() {
    try {
        // Google Sheets CSV export URL
        const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
        
        const response = await fetch(url);
        const csvText = await response.text();
        
        return convertCSVToJSON(csvText);
    } catch (error) {
        console.error('Error fetching Google Sheet data:', error);
        return null;
    }
}

function convertCSVToJSON(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(header => header.replace(/"/g, ''));
    
    const products = [];
    
    // Skip header row, process data rows
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue; // Skip empty lines
        
        const values = parseCSVLine(lines[i]);
        if (values.length < 9) continue; // Skip incomplete rows
        
        const product = {
            id: parseInt(values[0]) || i,
            name: values[1] || '',
            description: values[2] || '',
            originalPrice: parseFloat(values[3]) || 0,
            salePrice: parseFloat(values[4]) || 0,
            store: values[5] || 'amazon',
            category: values[6] || 'electronics',
            image: values[7] || 'placeholder.jpg',
            affiliateLink: values[8] || ''
        };
        
        products.push(product);
    }
    
    return products;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// Function to update products.json file
async function updateProductsFile() {
    const products = await fetchGoogleSheetData();
    
    if (products && products.length > 0) {
        // Save to products.json
        const jsonString = JSON.stringify(products, null, 4);
        
        // In a browser environment, you'd download the file
        // In Node.js, you'd write to file system
        console.log('Updated products data:');
        console.log(jsonString);
        
        // For browser use - creates a download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return products;
    } else {
        console.error('Failed to fetch or convert sheet data');
        return null;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { updateProductsFile, fetchGoogleSheetData };
}