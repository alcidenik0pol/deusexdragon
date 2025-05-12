# run like this
# blender --background --python fbx_to_glb_batch.py -- "C:\path\to\your\fbx\files"
import bpy
import os
from bpy.props import StringProperty
from bpy.types import Operator, Panel

class FBX_TO_GLB_OT_convert(Operator):
    """Convert FBX files to GLB format"""
    bl_idname = "fbx_to_glb.convert"
    bl_label = "Convert FBX to GLB"
    
    directory: StringProperty(
        name="Directory",
        description="Directory containing FBX files",
        subtype='DIR_PATH'
    )
    
    def execute(self, context):
        # Get the selected directory
        input_folder = self.directory
        if not os.path.exists(input_folder):
            self.report({'ERROR'}, f"Folder does not exist: {input_folder}")
            return {'CANCELLED'}
        
        # Find all FBX files
        fbx_files = [f for f in os.listdir(input_folder) if f.lower().endswith('.fbx')]
        if not fbx_files:
            self.report({'WARNING'}, f"No FBX files found in {input_folder}")
            return {'CANCELLED'}
        
        # Track conversion results
        success_count = 0
        failed_files = []
        
        # Process each file
        for fbx_file in fbx_files:
            # Clear scene
            bpy.ops.wm.read_factory_settings(use_empty=True)
            
            # Delete any objects that might be in the scene
            if bpy.context.scene.objects:
                bpy.ops.object.select_all(action='SELECT')
                bpy.ops.object.delete()
            
            # Import FBX
            fbx_path = os.path.join(input_folder, fbx_file)
            try:
                bpy.ops.import_scene.fbx(filepath=fbx_path)
                
                # Check if import worked
                if not bpy.context.scene.objects:
                    self.report({'WARNING'}, f"No objects imported from {fbx_file}")
                    failed_files.append(fbx_file)
                    continue
                
                # Export as GLB
                glb_file = os.path.splitext(fbx_file)[0] + ".glb"
                glb_path = os.path.join(input_folder, glb_file)
                
                bpy.ops.export_scene.gltf(
                    filepath=glb_path,
                    export_format='GLB',
                    export_texcoords=True,
                    export_normals=True,
                    export_materials=True,
                    export_animations=True
                )
                
                success_count += 1
                
            except Exception as e:
                self.report({'ERROR'}, f"Error processing {fbx_file}: {str(e)}")
                failed_files.append(fbx_file)
        
        # Report results
        if success_count > 0:
            self.report({'INFO'}, f"Successfully converted {success_count} of {len(fbx_files)} files.")
        
        if failed_files:
            self.report({'WARNING'}, f"Failed to convert {len(failed_files)} files: {', '.join(failed_files)}")
        
        return {'FINISHED'}

    def invoke(self, context, event):
        context.window_manager.fileselect_add(self)
        return {'RUNNING_MODAL'}

class FBX_TO_GLB_PT_panel(Panel):
    """FBX to GLB Converter Panel"""
    bl_label = "FBX to GLB Converter"
    bl_idname = "FBX_TO_GLB_PT_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'FBX to GLB'
    
    def draw(self, context):
        layout = self.layout
        
        col = layout.column(align=True)
        col.label(text="Select folder with FBX files:")
        col.operator("fbx_to_glb.convert", text="Select Folder & Convert")

classes = (
    FBX_TO_GLB_OT_convert,
    FBX_TO_GLB_PT_panel,
)

def register():
    for cls in classes:
        bpy.utils.register_class(cls)

def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)

if __name__ == "__main__":
    register()