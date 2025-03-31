// generate-metadata.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NodeIO } from '@gltf-transform/core';
// Also try to import Document and other useful classes
import { Document, Scene, Node, Mesh, Primitive, Accessor } from '@gltf-transform/core';
import { inspect } from 'util';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants for standard heights
const STANDARD_HEIGHTS = {
  characters: 1.8,  // 1.8 units tall
  buildings: 15,    // 15 units tall
  furniture: 1      // 1 unit tall
};

// Folders to process
const FOLDERS = ['characters', 'buildings', 'furniture'];

// Create a Node.js IO instance for glTF processing
const io = new NodeIO();

// Alternative function to extract bounding box directly from the GLB file
// This is a fallback if the standard method fails
async function extractBoundingBoxDirectly(filePath) {
  console.log(`Attempting direct bounding box extraction for ${filePath}`);
  
  try {
    const document = await io.read(filePath);
    const scene = document.getRoot().getDefaultScene() || document.getRoot().listScenes()[0];
    
    if (!scene) {
      console.warn(`No scene found in ${filePath}`);
      return null;
    }
    
    // Try to get bounding box by searching through nodes and examining transforms
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let hasVertices = false;
    
    // Function to process nodes recursively
    async function processNode(node) {
      // Check if node has mesh
      const mesh = node.getMesh();
      if (mesh) {
        for (const primitive of mesh.listPrimitives()) {
          // Try different property names that might contain position data
          const positionAccessor = primitive.getAttribute('POSITION');
          
          if (positionAccessor) {
            try {
              console.log(`Found position attribute in ${filePath}`);
              
              // Print available methods on position accessor for debugging
              console.log(`Position accessor methods: ${Object.getOwnPropertyNames(positionAccessor)}`);
              
              // Try different ways to get vertex data
              let vertexData;
              
              // Method 1: Using getArray directly if available
              if (typeof positionAccessor.getArray === 'function') {
                vertexData = await positionAccessor.getArray();
                console.log(`Got vertex data using getArray, length: ${vertexData.length}`);
              } 
              // Method 2: Try to access through buffer view
              else if (typeof positionAccessor.getBufferView === 'function') {
                const bufferView = positionAccessor.getBufferView();
                if (bufferView && typeof bufferView.getArray === 'function') {
                  vertexData = await bufferView.getArray();
                  console.log(`Got vertex data using bufferView, length: ${vertexData.length}`);
                }
              }
              // Method 3: Try to get raw data through inspection
              else {
                // Try to find position data by inspecting the object
                console.log(`Direct accessor methods unavailable, inspecting object:`, 
                  Object.keys(positionAccessor).filter(k => !k.startsWith('_')));
              }
              
              if (vertexData && vertexData.length) {
                hasVertices = true;
                // Process vertex data - assuming triplets of x,y,z
                for (let i = 0; i < vertexData.length; i += 3) {
                  const x = vertexData[i];
                  const y = vertexData[i + 1];
                  const z = vertexData[i + 2];
                  
                  if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    minZ = Math.min(minZ, z);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                    maxZ = Math.max(maxZ, z);
                  }
                }
              }
            } catch (error) {
              console.warn(`Error processing position data: ${error}`);
            }
          }
        }
      }
      
      // Process child nodes
      for (const child of node.listChildren()) {
        await processNode(child);
      }
    }
    
    // Process all nodes starting from the scene
    for (const node of scene.listChildren()) {
      await processNode(node);
    }
    
    if (!hasVertices || minX === Infinity || maxX === -Infinity) {
      console.warn(`Could not find valid vertex data in ${filePath}`);
      return null;
    }
    
    return {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ]
    };
  } catch (error) {
    console.error(`Error in direct bounding box extraction: ${error}`);
    return null;
  }
}

// Process a single GLB file
async function processGLBFile(filePath, category) {
  const fileName = path.basename(filePath);
  const fileDir = path.dirname(filePath);
  const fileNameWithoutExt = fileName.replace('.glb', '');
  
  try {
    console.log(`Loading GLB file: ${filePath}`);
    
    // Load the GLB document
    const document = await io.read(filePath);
    
    // Debug: Show document structure
    console.log(`Document loaded successfully. Inspecting structure...`);
    
    // Get all meshes
    const meshes = document.getRoot().listMeshes();
    console.log(`Found ${meshes.length} meshes in ${fileName}`);
    
    if (meshes.length === 0) {
      console.warn(`No meshes found in ${fileName}`);
      return null;
    }
    
    // Calculate bounding box across all meshes
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    for (const mesh of meshes) {
      for (const primitive of mesh.listPrimitives()) {
        try {
          // Direct access to the position attribute and its data
          const position = primitive.getAttribute('POSITION');
          if (!position) continue;
          
          // Get position data directly from the attribute
          // This approach uses the proper API methods based on @gltf-transform/core
          const accessor = position.getAccessor ? position.getAccessor() : position;
          
          if (!accessor) {
            console.warn(`Could not get position accessor in ${fileName}`);
            continue;
          }
          
          // Get vertex data - try different methods to handle possible API differences
          let array, count, itemSize;
          
          try {
            // Try to get array data 
            array = await accessor.getArray();
            count = accessor.getCount();
            itemSize = 3; // Positions are always XYZ (3 components)
            
            if (!array) throw new Error("Could not get position array");
          } catch (err) {
            console.log(`Trying alternative method to access position data in ${fileName}`);
            
            // Alternative method to get vertex data
            try {
              // Try to get the raw buffer data if accessor methods aren't available
              const bufferView = accessor.getBufferView ? accessor.getBufferView() : null;
              if (!bufferView) {
                console.warn(`No buffer view available for position data in ${fileName}`);
                continue;
              }
              
              array = await bufferView.getArray();
              count = accessor.getCount ? accessor.getCount() : (array.length / 3);
              itemSize = 3;
            } catch (bufferErr) {
              console.warn(`Failed to access position data: ${bufferErr}`);
              continue;
            }
          }
          
          // Process vertex data
          for (let i = 0; i < count; i++) {
            const x = array[i * itemSize];
            const y = array[i * itemSize + 1];
            const z = array[i * itemSize + 2];
            
            if (isNaN(x) || isNaN(y) || isNaN(z)) continue;
            
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            minZ = Math.min(minZ, z);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            maxZ = Math.max(maxZ, z);
          }
        } catch (error) {
          console.warn(`Error processing primitive in ${fileName}:`, error);
          continue;
        }
      }
    }
    
    // Check if we have valid bounds
    if (minX === Infinity || maxX === -Infinity) {
      console.log(`Standard method failed to determine bounds for ${fileName}, trying fallback method...`);
      
      // Try our fallback direct extraction method
      const boundingBox = await extractBoundingBoxDirectly(filePath);
      
      if (boundingBox) {
        console.log(`Fallback method succeeded for ${fileName}`);
        minX = boundingBox.min[0];
        minY = boundingBox.min[1];
        minZ = boundingBox.min[2];
        maxX = boundingBox.max[0];
        maxY = boundingBox.max[1];
        maxZ = boundingBox.max[2];
      } else {
        console.warn(`All methods failed to determine bounds for ${fileName}`);
        
        // If we can't determine bounds, use default values
        console.log(`Using default dimensions for ${fileName}`);
        minX = -0.5; minY = 0; minZ = -0.5;
        maxX = 0.5; maxY = 1.8; maxZ = 0.5;
      }
    }
    
    // Calculate dimensions
    const rawDimensions = {
      width: maxX - minX,
      height: maxY - minY,
      depth: maxZ - minZ
    };
    
    // Make sure height is not zero to avoid division by zero
    if (rawDimensions.height === 0) {
      rawDimensions.height = 0.01; // Set a small default
      console.warn(`Height is zero for ${fileName}, using default value`);
    }
    
    // Calculate scale factor to reach standard height for this category
    const standardHeight = STANDARD_HEIGHTS[category];
    const scaleFactor = standardHeight / rawDimensions.height;
    
    // Calculate standard dimensions
    const standardDimensions = {
      width: rawDimensions.width * scaleFactor,
      height: standardHeight,
      depth: rawDimensions.depth * scaleFactor
    };
    
    // Calculate grid footprint (how many 1x1 cells it would occupy)
    const gridFootprint = {
      width: Math.ceil(standardDimensions.width),
      depth: Math.ceil(standardDimensions.depth)
    };

    // Add sizeMultiplier with default value of 1
    const sizeMultiplier = 1;
    
    return {
      filePath,
      fileName,
      fileNameWithoutExt,
      rawDimensions,
      standardDimensions,
      scaleFactor,
      gridFootprint,
      sizeMultiplier
    };
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
    return null;
  }
}

// Function to recalculate metadata when sizeMultiplier is changed
function recalculateMetadata(metadata) {
  // Create a deep copy of the metadata to avoid modifying the original
  const updatedMetadata = JSON.parse(JSON.stringify(metadata));
  
  // Get the original dimensions before any size multiplier was applied
  const originalScaleFactor = updatedMetadata.scaleFactor / updatedMetadata.sizeMultiplier;
  
  // Apply the new size multiplier to the scale factor
  updatedMetadata.scaleFactor = originalScaleFactor * updatedMetadata.sizeMultiplier;
  
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

// Process character folder with multiple animations
async function processCharacterFolder(folderPath) {
  const characterName = path.basename(folderPath);
  const metadataPath = path.join(folderPath, `${characterName}.json`);
  
  // Skip if metadata already exists
  if (fs.existsSync(metadataPath)) {
    console.log(`Skipping ${characterName} - metadata already exists`);
    return;
  }
  
  console.log(`Processing character: ${characterName}`);
  
  // Get all GLB files in the character folder
  const files = fs.readdirSync(folderPath)
    .filter(file => file.endsWith('.glb'))
    .map(file => path.join(folderPath, file));
  
  if (files.length === 0) {
    console.log(`No GLB files found for character ${characterName}`);
    return;
  }
  
  // Process the first file to get dimensions (we'll use the same for all animations)
  const baseModelData = await processGLBFile(files[0], 'characters');
  
  if (!baseModelData) {
    console.error(`Failed to process base model for character ${characterName}`);
    return;
  }
  
  // Create animations object
  const animations = {};
  for (const file of files) {
    const animationName = path.basename(file).replace('.glb', '');
    animations[animationName] = path.basename(file);
  }
  
  // Create metadata
  const metadata = {
    id: characterName,
    type: 'characters',
    baseModel: path.basename(files[0]),
    animations,
    rawDimensions: baseModelData.rawDimensions,
    standardDimensions: baseModelData.standardDimensions,
    scaleFactor: baseModelData.scaleFactor,
    gridFootprint: baseModelData.gridFootprint,
    collisionType: 'capsule',
    sizeMultiplier: 1, // Default size multiplier
    facing: 'unknown' // Default facing direction
  };
  
  // Add utility for recalculation
  const metadataWithUtil = {
    ...metadata,
    // Add comment about how to use sizeMultiplier
    _comment: "To adjust size, change only the 'sizeMultiplier' value and run the adjust-size.js utility"
  };
  
  // Write metadata to file
  fs.writeFileSync(metadataPath, JSON.stringify(metadataWithUtil, null, 2));
  console.log(`Created metadata for character ${characterName}`);
}

// Process standard asset (buildings, furniture)
async function processStandardAsset(filePath, category) {
  const fileName = path.basename(filePath);
  const fileDir = path.dirname(filePath);
  const fileNameWithoutExt = fileName.replace('.glb', '');
  const metadataPath = path.join(fileDir, `${fileNameWithoutExt}.json`);
  
  // Skip if metadata already exists
  if (fs.existsSync(metadataPath)) {
    console.log(`Skipping ${fileName} - metadata already exists`);
    return;
  }
  
  console.log(`Processing ${fileName}`);
  
  const assetData = await processGLBFile(filePath, category);
  
  if (!assetData) {
    console.error(`Failed to process ${fileName}`);
    return;
  }
  
  // Create metadata
  const metadata = {
    id: fileNameWithoutExt,
    type: category,
    rawDimensions: assetData.rawDimensions,
    standardDimensions: assetData.standardDimensions,
    scaleFactor: assetData.scaleFactor,
    gridFootprint: assetData.gridFootprint,
    collisionType: category === 'characters' ? 'capsule' : 'box',
    sizeMultiplier: 1, // Default size multiplier
    facing: 'unknown' // Default facing direction
  };
  
  // Add utility for recalculation
  const metadataWithUtil = {
    ...metadata,
    // Add comment about how to use sizeMultiplier
    _comment: "To adjust size, change only the 'sizeMultiplier' value and run the adjust-size.js utility"
  };
  
  // Write metadata to file
  fs.writeFileSync(metadataPath, JSON.stringify(metadataWithUtil, null, 2));
  console.log(`Created metadata for ${fileName}`);
}

// Create directories if they don't exist
function ensureDirectoriesExist() {
  for (const folder of FOLDERS) {
    const folderPath = path.join(process.cwd(), folder);
    if (!fs.existsSync(folderPath)) {
      console.log(`Creating folder ${folder}`);
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }
}

async function main() {
  // Ensure required directories exist
  ensureDirectoriesExist();
  
  // Process each folder
  for (const folder of FOLDERS) {
    const folderPath = path.join(process.cwd(), folder);
    
    if (folder === 'characters') {
      // For characters, process each character subfolder
      let characterFolders = [];
      try {
        characterFolders = fs.readdirSync(folderPath)
          .filter(item => {
            const itemPath = path.join(folderPath, item);
            return fs.existsSync(itemPath) && fs.statSync(itemPath).isDirectory();
          })
          .map(dir => path.join(folderPath, dir));
      } catch (error) {
        console.error(`Error reading character folders: ${error}`);
      }
      
      console.log(`Found ${characterFolders.length} character folders`);
      
      // Process each character folder
      for (const characterFolder of characterFolders) {
        await processCharacterFolder(characterFolder);
      }
    } else {
      // For buildings and furniture, process GLB files directly
      let files = [];
      try {
        files = fs.readdirSync(folderPath)
          .filter(file => file.endsWith('.glb'))
          .map(file => path.join(folderPath, file));
      } catch (error) {
        console.error(`Error reading files in ${folder}: ${error}`);
      }
      
      console.log(`Found ${files.length} GLB files in ${folder}`);
      
      // Process each GLB file
      for (const file of files) {
        await processStandardAsset(file, folder);
      }
    }
  }
  
  console.log('Metadata generation complete');
}

// Run the script
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});