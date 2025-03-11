// adjust-size.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find all JSON files
function findJsonFiles(dir, excludeDirs = ['node_modules']) {
  const files = [];
  
  function scanDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      // Skip excluded directories
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          scanDir(fullPath);
        }
        continue;
      }
      
      // Add JSON files
      if (entry.isFile() && entry.name.endsWith('.json') && 
          !entry.name.includes('package.json') && !entry.name.includes('package-lock.json')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(dir);
  return files;
}

// Function to recalculate metadata when sizeMultiplier is changed
function recalculateMetadata(metadata) {
  // Create a deep copy of the metadata
  const updatedMetadata = JSON.parse(JSON.stringify(metadata));
  
  // Calculate the base scale factor (without size multiplier)
  const baseScaleFactor = updatedMetadata.scaleFactor / (updatedMetadata.oldSizeMultiplier || 1);
  
  // Apply the new size multiplier to get the new scaleFactor
  updatedMetadata.scaleFactor = baseScaleFactor * updatedMetadata.sizeMultiplier;
  
  // Store the current sizeMultiplier for future calculations
  updatedMetadata.oldSizeMultiplier = updatedMetadata.sizeMultiplier;
  
  // Recalculate standard dimensions
  updatedMetadata.standardDimensions = {
    width: updatedMetadata.rawDimensions.width * updatedMetadata.scaleFactor,
    height: updatedMetadata.rawDimensions.height * updatedMetadata.scaleFactor,
    depth: updatedMetadata.rawDimensions.depth * updatedMetadata.scaleFactor
  };
  
  // Recalculate grid footprint
  updatedMetadata.gridFootprint = {
    width: Math.ceil(updatedMetadata.standardDimensions.width),
    depth: Math.ceil(updatedMetadata.standardDimensions.depth)
  };
  
  return updatedMetadata;
}

// Update a single metadata file
function updateMetadataFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  try {
    // Read metadata
    const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Skip files that don't have required fields
    if (!metadata.sizeMultiplier || !metadata.scaleFactor || !metadata.rawDimensions) {
      console.log(`Skipping ${filePath} - not a valid model metadata file`);
      return null;
    }
    
    // Check if sizeMultiplier has changed
    const oldSizeMultiplier = metadata.oldSizeMultiplier || 1;
    
    if (metadata.sizeMultiplier === oldSizeMultiplier) {
      console.log(`No size change for ${filePath}, skipping`);
      return null;
    }
    
    console.log(`Changing size for ${metadata.id} from ${oldSizeMultiplier}x to ${metadata.sizeMultiplier}x`);
    
    // Recalculate all dimensions
    const updatedMetadata = recalculateMetadata(metadata);
    
    // Write updated metadata
    fs.writeFileSync(filePath, JSON.stringify(updatedMetadata, null, 2));
    
    console.log(`Updated ${filePath}`);
    
    return {
      id: metadata.id,
      oldSize: oldSizeMultiplier,
      newSize: metadata.sizeMultiplier,
      success: true
    };
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    
    return {
      file: filePath,
      success: false,
      error: error.message
    };
  }
}

// Check if specific file was provided
const targetFile = process.argv[2];

function main() {
  const results = {
    updated: [],
    failed: []
  };
  
  if (targetFile) {
    // Process single file
    if (fs.existsSync(targetFile)) {
      const result = updateMetadataFile(targetFile);
      if (result && result.success) {
        results.updated.push(result);
      } else if (result) {
        results.failed.push(result);
      }
    } else {
      console.error(`File not found: ${targetFile}`);
    }
  } else {
    // Process all JSON metadata files
    const jsonFiles = findJsonFiles(process.cwd());
    
    for (const file of jsonFiles) {
      const result = updateMetadataFile(file);
      if (result && result.success) {
        results.updated.push(result);
      } else if (result) {
        results.failed.push(result);
      }
    }
  }
  
  // Print summary
  console.log('\n--- Size Adjustment Summary ---');
  console.log(`Total files updated: ${results.updated.length}`);
  console.log(`Total files failed: ${results.failed.length}`);
  
  if (results.updated.length > 0) {
    console.log('\nUpdated files:');
    results.updated.forEach(item => {
      console.log(`- ${item.id}: ${item.oldSize}x → ${item.newSize}x`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\nFailed files:');
    results.failed.forEach(item => {
      console.log(`- ${item.file}: ${item.error}`);
    });
  }
}

try {
  main();
} catch (error) {
  console.error('Script error:', error);
  process.exit(1);
}