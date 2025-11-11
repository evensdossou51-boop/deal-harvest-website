# Product Validation Script (PowerShell)
# Run this before committing products.json to check for duplicates
# Usage: .\validate-products.ps1

Write-Host "`n🔍 Product Validation Script" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Read products.json
$productsPath = "products.json"

if (-not (Test-Path $productsPath)) {
    Write-Host "❌ Error: products.json not found!" -ForegroundColor Red
    exit 1
}

try {
    $products = Get-Content $productsPath -Raw | ConvertFrom-Json
    Write-Host "✅ Successfully loaded $($products.Count) products from products.json`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Error reading products.json: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Track seen items
$seenIds = @{}
$seenNames = @{}
$seenLinks = @{}
$hasErrors = $false

Write-Host "🔍 Checking for duplicates...`n" -ForegroundColor Cyan

# Check each product
for ($i = 0; $i -lt $products.Count; $i++) {
    $product = $products[$i]
    
    # Check ID
    if ($product.id) {
        if ($seenIds.ContainsKey($product.id)) {
            Write-Host "❌ DUPLICATE ID: $($product.id)" -ForegroundColor Red
            Write-Host "   First occurrence: Index $($seenIds[$product.id]) - `"$($products[$seenIds[$product.id]].name)`"" -ForegroundColor Yellow
            Write-Host "   Duplicate at:     Index $i - `"$($product.name)`"`n" -ForegroundColor Yellow
            $hasErrors = $true
        } else {
            $seenIds[$product.id] = $i
        }
    } else {
        Write-Host "⚠️  Missing ID at index $i`: `"$($product.name)`"" -ForegroundColor Yellow
    }
    
    # Check name (case-insensitive)
    $normalizedName = $product.name.ToLower().Trim()
    if ($normalizedName) {
        if ($seenNames.ContainsKey($normalizedName)) {
            Write-Host "❌ DUPLICATE NAME: `"$($product.name)`"" -ForegroundColor Red
            Write-Host "   First occurrence: Index $($seenNames[$normalizedName])" -ForegroundColor Yellow
            Write-Host "   Duplicate at:     Index $i`n" -ForegroundColor Yellow
            $hasErrors = $true
        } else {
            $seenNames[$normalizedName] = $i
        }
    }
    
    # Check affiliate link
    if ($product.affiliateLink) {
        $normalizedLink = $product.affiliateLink.ToLower().Trim()
        if ($seenLinks.ContainsKey($normalizedLink)) {
            Write-Host "❌ DUPLICATE AFFILIATE LINK: $($product.affiliateLink)" -ForegroundColor Red
            Write-Host "   First occurrence: Index $($seenLinks[$normalizedLink]) - `"$($products[$seenLinks[$normalizedLink]].name)`"" -ForegroundColor Yellow
            Write-Host "   Duplicate at:     Index $i - `"$($product.name)`"`n" -ForegroundColor Yellow
            $hasErrors = $true
        } else {
            $seenLinks[$normalizedLink] = $i
        }
    } else {
        Write-Host "⚠️  Missing affiliate link at index $i`: `"$($product.name)`"" -ForegroundColor Yellow
    }
    
    # Check required fields
    $requiredFields = @('id', 'name', 'description', 'originalPrice', 'salePrice', 'store', 'category', 'image', 'affiliateLink')
    $missingFields = $requiredFields | Where-Object { -not $product.$_ }
    
    if ($missingFields.Count -gt 0) {
        Write-Host "⚠️  Index $i`: `"$($product.name)`" is missing fields: $($missingFields -join ', ')" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "`n$("=" * 60)" -ForegroundColor Gray
Write-Host "VALIDATION SUMMARY" -ForegroundColor Cyan
Write-Host "$("=" * 60)" -ForegroundColor Gray
Write-Host "Total products: $($products.Count)"
Write-Host "Unique IDs: $($seenIds.Count)"
Write-Host "Unique names: $($seenNames.Count)"
Write-Host "Unique links: $($seenLinks.Count)"

if ($hasErrors) {
    Write-Host "`n❌ VALIDATION FAILED - Duplicates found!" -ForegroundColor Red
    Write-Host "Please remove duplicate products before committing.`n" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`n✅ VALIDATION PASSED - No duplicates found!" -ForegroundColor Green
    Write-Host "Safe to commit products.json`n" -ForegroundColor Green
    exit 0
}
