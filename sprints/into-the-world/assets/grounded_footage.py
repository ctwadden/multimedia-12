bl_info = {
    "name": "Grounded Footage (Learning Studio)",
    "author": "Learning Studio",
    "version": (1, 0, 0),
    "blender": (4, 2, 0),
    "location": "3D Viewport > Sidebar (N) > Grounded",
    "description": "Keeps keyed green-screen footage standing on the 3D floor when the actor walks towards or away from the camera "
                   "(automates Ian Hubert's parent-to-camera and scale-to-the-feet method).",
    "category": "Compositing",
}

"""How it works
Green-screen footage on a flat card has no depth: when the actor walks away they only rise up the frame and shrink, so on a
fixed card they appear to float and shrink. Ian Hubert's fix parents the card to the camera and keyframes its distance so the
feet touch the floor; because the card is scaled from the camera, it always fills the same frame and the actor keeps their
real size.

This add-on does that for every frame automatically:
  1. You track the actor's contact point (the front of the foot touching the floor) with a 2D track in Blender's Movie Clip
     editor.
  2. For each frame it casts a ray from the camera through that tracked point and finds where the ray hits the floor.
  3. It moves the footage card (parented to the camera) to exactly that depth and scales it to fill the camera frame, then
     keys the location and scale.
Because the tracked pixel sits on the same ray at the same depth, the feet land on the floor in the right place, and the
actor's size stays correct. Works with a static camera or a tracked, moving one.
"""

import bpy
from mathutils import Vector
from bpy.props import FloatProperty, IntProperty, PointerProperty, StringProperty


# ------------------------------------------------------------------ geometry
def frame_corners(scene, cam):
    """Camera view-frame corners in camera space (Blender order: top-right, bottom-right, bottom-left, top-left)."""
    return [Vector(v) for v in cam.data.view_frame(scene=scene)]


def ray_through(scene, cam, u, v):
    """World-space origin and direction of the ray through normalised frame coordinates (u, v), 0..1 from bottom-left."""
    tr, br, bl, tl = frame_corners(scene, cam)
    p_cam = bl + (br - bl) * u + (tl - bl) * v
    mw = cam.matrix_world
    origin = mw.translation.copy()
    if cam.data.type == 'ORTHO':
        origin = mw @ Vector((p_cam.x, p_cam.y, 0.0))
        direction = (mw.to_3x3() @ Vector((0, 0, -1))).normalized()
    else:
        direction = ((mw @ p_cam) - origin).normalized()
    return origin, direction


def floor_plane(ground):
    """Point and normal of the floor: the ground object's local XY plane, or world Z = 0 if none is set."""
    if ground is None:
        return Vector((0, 0, 0)), Vector((0, 0, 1))
    mw = ground.matrix_world
    return mw.translation.copy(), (mw.to_3x3() @ Vector((0, 0, 1))).normalized()


def intersect(origin, direction, p0, n):
    denom = direction.dot(n)
    if abs(denom) < 1e-9:
        return None
    t = (p0 - origin).dot(n) / denom
    return origin + direction * t if t > 0 else None


def card_transform(scene, cam, depth):
    """Location (camera space) and scale factor that make a card fill the camera frame at a given depth."""
    tr, br, bl, tl = frame_corners(scene, cam)
    z0 = -tr.z  # view_frame depth
    k = depth / z0
    centre = (tr + bl) / 2 * k
    width, height = (br - bl).length * k, (tl - bl).length * k
    return Vector((centre.x, centre.y, -depth)), width, height


def smooth(values, radius):
    if radius <= 0:
        return values
    out = []
    for i in range(len(values)):
        win = [v for v in values[max(0, i - radius):i + radius + 1] if v is not None]
        out.append(sum(win) / len(win) if win else None)
    return out


def ground_footage(scene, cam, card, clip, track_name, ground=None, start=None, end=None, smoothing=2):
    """Key the card so the tracked contact point stays on the floor. Returns a report dict."""
    track = clip.tracking.tracks.get(track_name) or next((t for o in clip.tracking.objects for t in o.tracks if t.name == track_name), None)
    if track is None:
        raise ValueError(f'No track called "{track_name}" in clip "{clip.name}".')
    start = scene.frame_start if start is None else start
    end = scene.frame_end if end is None else end
    offset = clip.frame_start - 1  # clip frame 1 plays at scene frame clip.frame_start
    p0, n = floor_plane(ground)
    depths, frames, missing = [], list(range(start, end + 1)), 0
    for f in frames:
        m = track.markers.find_frame(f - offset, exact=True)
        if m is None or m.mute:
            depths.append(None); missing += 1; continue
        scene.frame_set(f)
        o, d = ray_through(scene, cam, m.co[0], m.co[1])
        hit = intersect(o, d, p0, n)
        if hit is None:
            depths.append(None); missing += 1; continue
        depths.append(-(cam.matrix_world.inverted() @ hit).z)
    depths = smooth(depths, smoothing)
    # fill gaps (foot hidden behind something) by holding the nearest known depth
    known = [(i, v) for i, v in enumerate(depths) if v is not None]
    if not known:
        raise ValueError('The track has no usable markers in this frame range.')
    for i in range(len(depths)):
        if depths[i] is None:
            depths[i] = min(known, key=lambda kv: abs(kv[0] - i))[1]
    # card: parent to camera without changing its mesh; mesh width/height measured once
    if card.parent != cam:
        card.parent = cam
        card.matrix_parent_inverse.identity()
    card.rotation_mode = 'XYZ'; card.rotation_euler = (0, 0, 0)
    xs = [v.co.x for v in card.data.vertices]; ys = [v.co.y for v in card.data.vertices]
    mesh_w, mesh_h = (max(xs) - min(xs)) or 1.0, (max(ys) - min(ys)) or 1.0
    if card.animation_data and card.animation_data.action:
        for fc in list(card.animation_data.action.fcurves) if hasattr(card.animation_data.action, 'fcurves') else []:
            if fc.data_path in ('location', 'scale'):
                card.animation_data.action.fcurves.remove(fc)
    for f, depth in zip(frames, depths):
        scene.frame_set(f)
        loc, w, h = card_transform(scene, cam, depth)
        card.location = loc
        card.scale = (w / mesh_w, h / mesh_h, 1.0)
        card.keyframe_insert('location', frame=f); card.keyframe_insert('scale', frame=f)
    return {'frames': len(frames), 'missing': missing, 'min_depth': min(depths), 'max_depth': max(depths)}


# ------------------------------------------------------------------ UI
class GF_Settings(bpy.types.PropertyGroup):
    camera: PointerProperty(name='Camera', type=bpy.types.Object, poll=lambda s, o: o.type == 'CAMERA')
    card: PointerProperty(name='Footage card', type=bpy.types.Object, poll=lambda s, o: o.type == 'MESH')
    ground: PointerProperty(name='Floor (optional)', type=bpy.types.Object, description='Floor object; its local XY plane is the floor. Empty = world floor at Z 0')
    clip: PointerProperty(name='Movie clip', type=bpy.types.MovieClip)
    track: StringProperty(name='Foot track', description='Name of the 2D track on the actor’s contact point (front of the foot)')
    smoothing: IntProperty(name='Smoothing', default=2, min=0, max=10, description='Frames either side to average, to remove tracking jitter')


class GF_OT_ground(bpy.types.Operator):
    bl_idname = 'grounded.ground_footage'
    bl_label = 'Ground the footage'
    bl_description = 'Key the footage card so the tracked foot stays on the floor on every frame'
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        s = context.scene.grounded
        if not (s.camera and s.card and s.clip and s.track):
            self.report({'ERROR'}, 'Choose a camera, a footage card, a movie clip and a foot track.'); return {'CANCELLED'}
        try:
            r = ground_footage(context.scene, s.camera, s.card, s.clip, s.track, s.ground, smoothing=s.smoothing)
        except ValueError as e:
            self.report({'ERROR'}, str(e)); return {'CANCELLED'}
        self.report({'INFO'}, f"Grounded {r['frames']} frames ({r['missing']} filled). Depth {r['min_depth']:.2f}–{r['max_depth']:.2f}")
        return {'FINISHED'}


class GF_PT_panel(bpy.types.Panel):
    bl_label = 'Grounded Footage'
    bl_space_type = 'VIEW_3D'; bl_region_type = 'UI'; bl_category = 'Grounded'

    def draw(self, context):
        s = context.scene.grounded; col = self.layout.column()
        col.label(text='1. Track the front of the foot'); col.prop(s, 'clip'); col.prop_search(s, 'track', s.clip.tracking, 'tracks') if s.clip else col.prop(s, 'track')
        col.label(text='2. Choose the scene parts'); col.prop(s, 'camera'); col.prop(s, 'card'); col.prop(s, 'ground'); col.prop(s, 'smoothing')
        col.operator('grounded.ground_footage', icon='ANCHOR_BOTTOM')
        col.label(text='Tip: footage material Shadow = Alpha Hashed', icon='INFO')


CLASSES = (GF_Settings, GF_OT_ground, GF_PT_panel)


def register():
    for c in CLASSES:
        bpy.utils.register_class(c)
    bpy.types.Scene.grounded = PointerProperty(type=GF_Settings)


def unregister():
    del bpy.types.Scene.grounded
    for c in reversed(CLASSES):
        bpy.utils.unregister_class(c)


if __name__ == '__main__':
    register()
