import json
import os
from pygltflib import GLTF2
import struct
from collections import defaultdict

def analyze_glb(filepath):
    """Analyze a GLB file and return detailed information about its contents"""
    gltf = GLTF2.load(filepath)
    
    filesize = os.path.getsize(filepath)
    
    # Basic file info
    info = {
        "filename": os.path.basename(filepath),
        "filesize_bytes": filesize,
        "filesize_mb": round(filesize / (1024 * 1024), 2),
        
        # Scene info
        "scenes": len(gltf.scenes),
        "nodes": len(gltf.nodes),
        "meshes": len(gltf.meshes),
        "materials": len(gltf.materials),
        "textures": len(gltf.textures),
        "images": len(gltf.images),
        
        # Animation info
        "animations": [],
        
        # Detailed node info
        "node_hierarchy": [],
        
        # Material details
        "material_details": [],
        
        # Mesh details
        "mesh_details": []
    }
    
    # Analyze animations
    for idx, animation in enumerate(gltf.animations):
        anim_info = {
            "index": idx,
            "channels": len(animation.channels),
            "samplers": len(animation.samplers),
            "targeted_properties": []
        }
        
        # Get what properties are being animated
        for channel in animation.channels:
            if channel.target:
                prop = channel.target.path
                node_idx = channel.target.node
                node_name = gltf.nodes[node_idx].name if node_idx is not None else "unknown"
                anim_info["targeted_properties"].append({
                    "property": prop,
                    "node": node_name
                })
        
        info["animations"].append(anim_info)
    
    # Analyze node hierarchy
    def process_node(node_idx, depth=0):
        if node_idx is None:
            return None
            
        node = gltf.nodes[node_idx]
        node_info = {
            "name": node.name or f"Node_{node_idx}",
            "depth": depth,
            "has_mesh": node.mesh is not None,
            "has_skin": node.skin is not None,
            "has_children": bool(node.children),
            "translation": node.translation,
            "rotation": node.rotation,
            "scale": node.scale
        }
        
        if node.children:
            node_info["children"] = [
                process_node(child_idx, depth + 1) 
                for child_idx in node.children
            ]
        
        return node_info
    
    # Process root nodes
    for scene in gltf.scenes:
        for node_idx in scene.nodes:
            info["node_hierarchy"].append(process_node(node_idx))
    
    # Analyze materials
    for idx, material in enumerate(gltf.materials):
        mat_info = {
            "index": idx,
            "name": material.name,
            "has_pbr_metallic_roughness": bool(material.pbrMetallicRoughness),
            "is_double_sided": material.doubleSided,
            "alpha_mode": material.alphaMode,
            "has_normal_texture": bool(material.normalTexture),
            "has_occlusion_texture": bool(material.occlusionTexture),
            "has_emissive_texture": bool(material.emissiveTexture)
        }
        
        if material.pbrMetallicRoughness:
            pbr = material.pbrMetallicRoughness
            mat_info["pbr_details"] = {
                "base_color_factor": pbr.baseColorFactor,
                "metallic_factor": pbr.metallicFactor,
                "roughness_factor": pbr.roughnessFactor,
                "has_base_color_texture": bool(pbr.baseColorTexture),
                "has_metallic_roughness_texture": bool(pbr.metallicRoughnessTexture)
            }
            
        info["material_details"].append(mat_info)
    
    # Analyze meshes
    for idx, mesh in enumerate(gltf.meshes):
        mesh_info = {
            "index": idx,
            "name": mesh.name,
            "primitives": []
        }
        
        for prim in mesh.primitives:
            prim_info = {
                "material": prim.material,
                "mode": prim.mode,  # 4 = triangles
                "attributes": prim.attributes.__dict__,
                "has_indices": prim.indices is not None
            }
            mesh_info["primitives"].append(prim_info)
            
        info["mesh_details"].append(mesh_info)
    
    return info

def analyze_folder(folder_path):
    """Analyze all GLB files in a folder and save results to JSON"""
    results = {}
    
    for filename in os.listdir(folder_path):
        if filename.lower().endswith('.glb'):
            filepath = os.path.join(folder_path, filename)
            try:
                results[filename] = analyze_glb(filepath)
            except Exception as e:
                results[filename] = {"error": str(e)}
    
    # Save to JSON
    output_path = os.path.join(folder_path, 'glb_analysis.json')
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"Analysis saved to: {output_path}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python glb_analyzer.py <folder_path>")
        sys.exit(1)
        
    folder_path = sys.argv[1]
    analyze_folder(folder_path)