import json
import os
from pygltflib import GLTF2
import numpy as np
import struct
import sys

def get_buffer_data(gltf, buffer_idx):
    """Safely get buffer data handling both embedded and binary chunk cases"""
    buffer = gltf.buffers[buffer_idx]
    
    # Case 1: Buffer data is already loaded
    if hasattr(buffer, 'data') and buffer.data is not None:
        return buffer.data
        
    # Case 2: Buffer data is in binary chunk
    if hasattr(gltf, '_glb_data'):
        return gltf._glb_data
    
    return None

def decode_accessor_data(gltf, accessor_idx):
    """Decode binary data from an accessor"""
    if accessor_idx is None:
        return None
        
    accessor = gltf.accessors[accessor_idx]
    bufferView = gltf.bufferViews[accessor.bufferView]
    
    # Get buffer data safely
    buffer_data = get_buffer_data(gltf, bufferView.buffer)
    if buffer_data is None:
        return None
    
    # Get the binary data
    data = buffer_data[
        bufferView.byteOffset + (accessor.byteOffset or 0):
        bufferView.byteOffset + bufferView.byteLength
    ]
    
    # Define the format based on component type and type
    component_fmt = {
        5120: 'b',  # BYTE
        5121: 'B',  # UNSIGNED_BYTE
        5122: 'h',  # SHORT
        5123: 'H',  # UNSIGNED_SHORT
        5125: 'I',  # UNSIGNED_INT
        5126: 'f'   # FLOAT
    }
    
    type_count = {
        'SCALAR': 1,
        'VEC2': 2,
        'VEC3': 3,
        'VEC4': 4,
        'MAT2': 4,
        'MAT3': 9,
        'MAT4': 16
    }
    
    fmt = component_fmt[accessor.componentType]
    count = type_count[accessor.type]
    
    # Calculate stride
    stride = bufferView.byteStride if bufferView.byteStride is not None else (count * struct.calcsize(fmt))
    
    # Decode the data
    try:
        decoded = []
        offset = 0
        for _ in range(accessor.count):
            element = struct.unpack_from(fmt * count, data, offset)
            decoded.append(list(element) if count > 1 else element[0])
            offset += stride
        return decoded
    except Exception as e:
        print(f"Warning: Failed to decode accessor data: {str(e)}")
        return None


def analyze_skeleton(gltf, node_idx, depth=0):
    """Recursively analyze the skeleton hierarchy"""
    if node_idx is None:
        return None
        
    node = gltf.nodes[node_idx]
    node_info = {
        "name": node.name or f"Node_{node_idx}",
        "index": node_idx,
        "depth": depth,
        "type": "bone" if node.name and "bone" in node.name.lower() else "node",
        "properties": {
            "translation": node.translation,
            "rotation": node.rotation,
            "scale": node.scale,
            "matrix": node.matrix
        }
    }
    
    if node.skin is not None:
        skin = gltf.skins[node.skin]
        node_info["skin"] = {
            "joints": skin.joints,
            "inverse_bind_matrices": decode_accessor_data(gltf, skin.inverseBindMatrices) if skin.inverseBindMatrices is not None else None
        }
    
    if node.children:
        node_info["children"] = [
            analyze_skeleton(gltf, child_idx, depth + 1) 
            for child_idx in node.children
        ]
    
    return node_info
def analyze_animation(gltf, animation, idx):
    """Analyze a single animation in detail"""
    anim_info = {
        "index": idx,
        "channels": [],
        "samplers": []
    }
    
    # Analyze samplers first
    for sampler_idx, sampler in enumerate(animation.samplers):
        # Get the actual keyframe timing data
        time_data = decode_accessor_data(gltf, sampler.input)
        
        # Get the actual transformation values
        transform_data = decode_accessor_data(gltf, sampler.output)
        
        sampler_info = {
            "index": sampler_idx,
            "interpolation": sampler.interpolation,  # LINEAR, STEP, or CUBICSPLINE
            "keyframe_times": time_data,            # When things happen
            "keyframe_values": transform_data,      # What happens (rotations, translations, etc)
            "input_accessor": {                     # Technical details about the timing data
                "accessor_idx": sampler.input,
                "componentType": gltf.accessors[sampler.input].componentType,
                "type": gltf.accessors[sampler.input].type,
                "count": gltf.accessors[sampler.input].count
            },
            "output_accessor": {                    # Technical details about the transform data
                "accessor_idx": sampler.output,
                "componentType": gltf.accessors[sampler.output].componentType,
                "type": gltf.accessors[sampler.output].type,
                "count": gltf.accessors[sampler.output].count
            }
        }
        
        anim_info["samplers"].append(sampler_info)
    
    # Now analyze channels (what the animation affects)
    for channel_idx, channel in enumerate(animation.channels):
        if channel.target:
            node_idx = channel.target.node
            node = gltf.nodes[node_idx] if node_idx is not None else None
            
            channel_info = {
                "index": channel_idx,
                "sampler_idx": channel.sampler,     # Links to the sampler with the actual data
                "target": {
                    "node_index": node_idx,
                    "node_name": node.name if node else None,
                    "property": channel.target.path  # What property is animated (translation, rotation, etc)
                }
            }
            
            # Add the actual keyframe data from the linked sampler
            if channel.sampler < len(anim_info["samplers"]):
                sampler = anim_info["samplers"][channel.sampler]
                channel_info["keyframes"] = {
                    "times": sampler["keyframe_times"],
                    "values": sampler["keyframe_values"],
                    "interpolation": sampler["interpolation"]
                }
            
            anim_info["channels"].append(channel_info)
    
    return anim_info

def analyze_glb(filepath):
    """Analyze a GLB file and return detailed information about its contents"""
    gltf = GLTF2.load(filepath)
    
    filesize = os.path.getsize(filepath)
    
    info = {
        "filename": os.path.basename(filepath),
        "filesize_bytes": filesize,
        "filesize_mb": round(filesize / (1024 * 1024), 2),
        
        # Basic counts
        "scenes": len(gltf.scenes),
        "nodes": len(gltf.nodes),
        "meshes": len(gltf.meshes),
        "materials": len(gltf.materials),
        "textures": len(gltf.textures),
        "images": len(gltf.images),
        "skins": len(gltf.skins),
        "animations": [],
        
        # Detailed skeleton info
        "skeleton_hierarchy": [],
        
        # Detailed mesh info
        "mesh_details": []
    }
    
    # Analyze skeleton hierarchy starting from root nodes
    for scene in gltf.scenes:
        for node_idx in scene.nodes:
            info["skeleton_hierarchy"].append(
                analyze_skeleton(gltf, node_idx)
            )
    
    # Analyze animations
    for idx, animation in enumerate(gltf.animations):
        info["animations"].append(
            analyze_animation(gltf, animation, idx)
        )
    
    # Analyze meshes
    for idx, mesh in enumerate(gltf.meshes):
        mesh_info = {
            "index": idx,
            "name": mesh.name,
            "primitives": []
        }
        
        for prim in mesh.primitives:
            primitive_info = {
                "material_index": prim.material,
                "mode": prim.mode,  # 4 = triangles
                "attributes": {}
            }
            
            # Decode vertex attributes
            for attr_name, accessor_idx in vars(prim.attributes).items():
                if accessor_idx is not None:
                    accessor = gltf.accessors[accessor_idx]
                    primitive_info["attributes"][attr_name] = {
                        "count": accessor.count,
                        "type": accessor.type,
                        "component_type": accessor.componentType
                    }
            
            mesh_info["primitives"].append(primitive_info)
            
        info["mesh_details"].append(mesh_info)
    
    return info

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python glb_analyzer.py <folder_path>")
        sys.exit(1)
        
    folder_path = sys.argv[1]
    
    if not os.path.isdir(folder_path):
        print("Error: Please provide a folder path")
        sys.exit(1)
    
    # Create an analysis folder if it doesn't exist
    analysis_folder = os.path.join(folder_path, "analysis")
    if not os.path.exists(analysis_folder):
        os.makedirs(analysis_folder)
    
    # Process each GLB file
    for filename in os.listdir(folder_path):
        if filename.lower().endswith('.glb'):
            filepath = os.path.join(folder_path, filename)
            try:
                # Generate output filename based on GLB filename
                base_name = os.path.splitext(filename)[0]
                output_path = os.path.join(analysis_folder, f"{base_name}_analysis.json")
                
                # Analyze and save
                result = analyze_glb(filepath)
                with open(output_path, 'w') as f:
                    json.dump(result, f, indent=2)
                print(f"Created: {output_path}")
                
            except Exception as e:
                print(f"Error processing {filename}: {str(e)}")
    
    print(f"\nAnalysis complete. Check the 'analysis' folder.")