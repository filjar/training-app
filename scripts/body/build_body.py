"""Builds the 3D body models used by the app's muscle selector.

Run headless with Blender (needs the MPFB / MakeHuman extension installed):

    blender -b --python scripts/body/build_body.py -- --type woman --out public/models/woman.glb

For each body it: creates a MakeHuman body, strips the helper geometry, assigns
every vertex a muscle id and border weight by rule (skeleton weights +
landmarks + where it sits round the torso or limb), sculpts muscle definition
into the surface, and exports a GLB whose `_MUSCLE` / `_MUSCLE2` vertex
attributes hold the two strongest muscles at each vertex. `--preview some.png` also renders a 4-view picture of the regions.

All MakeHuman bodies share one mesh layout, so the same rules work for every
body type. Muscle ids index into MUSCLES below (0 = not a muscle); the same
order is hard-coded in src/components/BodyModel.jsx.
"""
import argparse
import json
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.locationservice import LocationService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService

MUSCLES = [
    None, 'Chest', 'Shoulders', 'Traps', 'Biceps', 'Triceps', 'Abs',
    'Obliques', 'Lats', 'Lower Back', 'Glutes', 'Quads', 'Hamstrings', 'Calves',
]
# The forearm is still shaped as a muscle, but it is not a selectable group.
ID = {name: i for i, name in enumerate(MUSCLES) if name}

# MakeHuman sliders per body: 'macros' are the main sliders (0..1), 'targets'
# are detail shapes from MPFB's data/targets folder with their strength.
MUSCLE_TARGETS = {
    'arms/{s}-upperarm-muscle-incr': 1.0, 'arms/{s}-upperarm-shoulder-muscle-incr': 1.0,
    'arms/{s}-lowerarm-muscle-incr': 0.8, 'arms/{s}-upperarm-fat-decr': 0.6, 'arms/{s}-lowerarm-fat-decr': 0.6,
    'legs/{s}-upperleg-muscle-incr': 1.0, 'legs/{s}-lowerleg-muscle-incr': 1.0,
    'legs/{s}-upperleg-fat-decr': 0.6, 'legs/{s}-lowerleg-fat-decr': 0.6,
    'torso/torso-muscle-dorsi-incr': 1.0, 'torso/torso-muscle-pectoral-incr': 0.8, 'torso/torso-vshape-incr': 0.6,
    'stomach/stomach-tone-incr': 1.0, 'pelvis/pelvis-tone-incr': 1.0,
}
BODY_TYPES = {
    'woman': dict(macros=dict(gender=0.0, muscle=0.88, weight=0.32, proportions=0.85, cupsize=0.4, firmness=1.0),
                  targets={**MUSCLE_TARGETS, 'torso/torso-muscle-pectoral-incr': 0.15, 'torso/torso-vshape-incr': 0.2,
                           'arms/{s}-upperarm-shoulder-muscle-incr': 0.7},
                  belly={'Chest': 0.0015}),
    'man': dict(macros=dict(gender=1.0, muscle=1.0, weight=0.35, proportions=0.8), targets=MUSCLE_TARGETS),
}

PREVIEW_COLORS = [
    (0.62, 0.64, 0.68), (0.88, 0.27, 0.18), (0.95, 0.6, 0.1), (0.55, 0.35, 0.8), (0.2, 0.6, 0.9),
    (0.1, 0.75, 0.6), (0.9, 0.8, 0.2), (0.9, 0.4, 0.6), (0.4, 0.8, 0.3), (0.2, 0.4, 0.75),
    (0.75, 0.5, 0.3), (0.85, 0.2, 0.5), (0.3, 0.7, 0.75), (0.6, 0.6, 0.2), (0.5, 0.3, 0.6),
]


def parse_args():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument('--type', default='woman', choices=list(BODY_TYPES))
    p.add_argument('--out')
    p.add_argument('--preview')
    p.add_argument('--plain', action='store_true', help='preview without region colours, to judge the shape')
    return p.parse_args(argv)


def create_body(body_type):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    macros = TargetService.get_default_macro_info_dict()
    macros.update(BODY_TYPES[body_type]['macros'])
    obj = HumanService.create_human(mask_helpers=False, detailed_helpers=True, extra_vertex_groups=True,
                                    feet_on_ground=True, scale=0.1, macro_detail_dict=macros)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    target_dir = LocationService.get_mpfb_data('targets')
    for name, strength in BODY_TYPES[body_type]['targets'].items():
        for side in (('l', 'r') if '{s}' in name else ('',)):
            path = os.path.join(target_dir, name.format(s=side) + '.target.gz')
            TargetService.load_target(obj, path, weight=strength)
    if obj.data.shape_keys:
        bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
    return obj


def neutralise(obj):
    """Removes nipple and genital detail so the body reads as a neutral figure.

    Around each nipple the surface is replaced by the smooth dome fitted to the
    ring of skin just outside it, which keeps the chest's shape.
    """
    me = obj.data
    wanted = {obj.vertex_groups[n].index for n in ('nipple', 'nippleTip') if n in obj.vertex_groups}
    seed = [v for v in me.vertices if any(g.group in wanted and g.weight > 0 for g in v.groups)]
    body = obj.vertex_groups['body'].index
    skin = [v for v in me.vertices if any(g.group == body for g in v.groups)]
    radius = 0.036
    for side in (1, -1):
        tips = [v for v in seed if v.co.x * side > 0]
        if not tips:
            continue
        centre = sum((v.co for v in tips), Vector()) / len(tips)
        axis = sum((v.normal for v in tips), Vector()).normalized()

        def polar(v):
            rel = v.co - centre
            height = rel.dot(axis)
            return (rel - axis * height).length, height

        near = [(v, *polar(v)) for v in skin if (v.co - centre).length < radius * 1.6]
        ring = [(d, hgt) for _, d, hgt in near if radius * 0.62 < d < radius]
        # least-squares fit of height = a + b·d² over the ring
        n = len(ring)
        sx = sum(d * d for d, _ in ring)
        sxx = sum(d ** 4 for d, _ in ring)
        sy = sum(hgt for _, hgt in ring)
        sxy = sum(d * d * hgt for d, hgt in ring)
        b = (n * sxy - sx * sy) / (n * sxx - sx * sx)
        a = (sy - b * sx) / n
        for v, d, hgt in near:
            blend = 1 - smoothstep(radius * 0.5, radius * 0.68, d)
            if blend > 0:
                v.co += axis * ((a + b * d * d - hgt) * blend)

    # Soften the crease between the legs with a few rounds of neighbour averaging.
    crotch = min((v.co.z for v in skin if abs(v.co.x) < 0.004 and v.co.z > 0.5), default=None)
    if crotch is not None:
        region = {v.index for v in skin if abs(v.co.x) < 0.035 and crotch - 0.01 < v.co.z < crotch + 0.09 and v.normal.y < 0.3}
        nbrs = {i: [] for i in region}
        for e in me.edges:
            i, j = e.vertices
            if i in region: nbrs[i].append(j)
            if j in region: nbrs[j].append(i)
        for _ in range(25):
            new = {i: me.vertices[i].co.lerp(sum((me.vertices[j].co for j in ns), Vector()) / len(ns), 0.6)
                   for i, ns in nbrs.items() if ns}
            for i, co in new.items():
                me.vertices[i].co = co
    me.update()


def group_members(obj, name):
    idx = obj.vertex_groups[name].index
    return [v.index for v in obj.data.vertices if any(g.group == idx and g.weight > 0.5 for g in v.groups)]


def landmarks(obj):
    """Centre of every joint helper cube, keyed without the 'joint-' prefix."""
    out = {}
    for g in obj.vertex_groups:
        if not g.name.startswith('joint-'):
            continue
        pts = [obj.data.vertices[i].co for i in group_members(obj, g.name)]
        if pts:
            out[g.name[6:]] = sum(pts, Vector()) / len(pts)
    return out


PARTS = ['upperarm', 'forearm', 'hand', 'thigh', 'shin', 'foot', 'torso', 'neck', 'head']


def add_part_groups(obj):
    """Stores how much each vertex belongs to each body part (from the default
    MakeHuman rig weights) as vertex groups, so the values survive subdivision."""
    path = os.path.join(LocationService.get_mpfb_data('rigs'), 'standard', 'weights.default.json')
    with open(path) as f:
        weights = json.load(f)['weights']

    def part_of(bone):
        b = bone.split('.')[0]
        if b.startswith('upperarm'): return 'upperarm'
        if b.startswith('lowerarm'): return 'forearm'
        if b.startswith(('wrist', 'finger', 'metacarpal')): return 'hand'
        if b.startswith('upperleg'): return 'thigh'
        if b.startswith('lowerleg'): return 'shin'
        if b.startswith(('foot', 'toe')): return 'foot'
        if b.startswith(('spine', 'breast', 'pelvis', 'root', 'clavicle', 'shoulder')): return 'torso'
        if b.startswith('neck'): return 'neck'
        return 'head'

    n_verts = len(obj.data.vertices)
    totals = {name: {} for name in PARTS}
    for bone, pairs in weights.items():
        part = totals[part_of(bone)]
        for idx, w in pairs:
            if idx < n_verts:
                part[idx] = part.get(idx, 0.0) + w
    for name, per_vertex in totals.items():
        group = obj.vertex_groups.new(name='part:' + name)
        for idx, w in per_vertex.items():
            group.add([idx], min(1.0, w), 'REPLACE')


def lower_arms(obj, lm):
    """Swings the arms down about the shoulder joints to ARM_ANGLE from vertical.

    Each vertex turns by the angle times how much it belongs to the arm, which
    bends the shoulder smoothly. The elbow and hand landmarks move with it.
    """
    names = {g.index for g in obj.vertex_groups if g.name in ('part:upperarm', 'part:forearm', 'part:hand')}
    sh, el = lm['l-shoulder'], lm['l-elbow']
    current = math.atan2(el.x - sh.x, sh.z - el.z)      # arm's angle out from straight down
    turn = current - math.radians(ARM_ANGLE)

    def swing(co, pivot, angle):
        dx, dz = co.x - pivot.x, co.z - pivot.z
        c, s_ = math.cos(angle), math.sin(angle)
        return Vector((pivot.x + dx * c - dz * s_, co.y, pivot.z + dx * s_ + dz * c))

    for v in obj.data.vertices:
        w = min(1.0, sum(g.weight for g in v.groups if g.group in names))
        if w <= 0:
            continue
        side = 1 if v.co.x >= 0 else -1
        pivot = Vector((sh.x * side, sh.y, sh.z))
        # ease the blend so the shoulder cap follows the arm a little later than the arm itself
        v.co = swing(v.co, pivot, -side * turn * smoothstep(0.0, 1.0, w))
    for name in ('l-elbow', 'l-hand'):
        lm[name] = swing(lm[name], sh, -turn)
    obj.data.update()


def read_part_groups(obj):
    names = {g.index: g.name[5:] for g in obj.vertex_groups if g.name.startswith('part:')}
    return [{names[g.group]: g.weight for g in v.groups if g.group in names} for v in obj.data.vertices]


def smoothstep(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def band(x, lo, hi, scale):
    """Margin (≈ metres) by which x is inside lo..hi; negative outside."""
    return min(x - lo, hi - x) * scale


def oval(x, y, cx, cy, rx, ry, sx, sy, power=4):
    """Margin inside a rounded rectangle (a superellipse), so regions get soft corners."""
    d = (abs((x - cx) / rx) ** power + abs((y - cy) / ry) ** power) ** (1 / power)
    return (1 - d) * min(rx * sx, ry * sy)


def limb_coords(p, a, b):
    """Position along the a→b bone (0..1) and the unit direction from the bone out to p."""
    axis = b - a
    t = (p - a).dot(axis) / axis.length_squared
    radial = p - (a + axis * t)
    return t, (radial.normalized() if radial.length > 1e-6 else Vector((0, 0, 0)))


# Where two regions meet, the one later in this list gives way and a thin strip
# of GAP metres is left between them. EDGE is the half-width of the soft border
# zone the app uses to draw a smooth outline.
PRIORITY = ['Shoulders', 'Chest', 'Abs', 'Traps', 'Lower Back', 'Glutes', 'Biceps', 'Triceps',
            'Forearms', 'Quads', 'Hamstrings', 'Calves', 'Obliques', 'Lats']
ARM_ANGLE = 27  # degrees the arms hang out from straight down
GAP = 0.004
EDGE = 0.015


# How far (metres) each muscle's belly is pushed out of the surface, so the
# muscles are visibly defined on the model itself.
BELLY = {
    'Shoulders': 0.005, 'Chest': 0.004, 'Abs': 0.003, 'Obliques': 0.0025, 'Traps': 0.006, 'Lats': 0.006,
    'Lower Back': 0.003, 'Glutes': 0.004, 'Biceps': 0.007, 'Triceps': 0.006, 'Forearms': 0.003,
    'Quads': 0.002, 'Hamstrings': 0.005, 'Calves': 0.005,
}


def bump(x, width):
    return math.exp(-(x / width) ** 2)


def classify(obj, lm, parts, belly):
    """Returns (two (muscle id, weight) pairs, sculpt offset) per vertex.

    Every muscle is a smooth field over the body surface: positive inside the
    region, negative outside, roughly in metres from its border. A vertex gets
    the muscle whose field is highest there and a weight that crosses 0.5
    exactly on the border — the app interpolates the weight across triangles,
    which gives region outlines much finer than the mesh itself.
    """
    me = obj.data
    sh, el, wr = lm['l-shoulder'], lm['l-elbow'], lm['l-hand']
    hip, kn, an = lm['l-upper-leg'], lm['l-knee'], lm['l-ankle']
    neck = lm['neck']
    L = sh.z - hip.z                 # torso length: hip joint → shoulder joint
    SW = sh.x                        # half shoulder width
    AU, AF = (el - sh).length, (wr - el).length
    TL, SL = (kn - hip).length, (an - kn).length
    FWD, UP = Vector((0, -1, 0)), Vector((0, 0, 1))
    # 'Up' as seen from the arm: straight out from the bone, on its top side.
    arm_axis = (el - sh).normalized()
    ARM_UP = (UP - arm_axis * UP.dot(arm_axis)).normalized()
    BICEPS_DIR = (FWD + ARM_UP * 0.4).normalized()
    NRM = 0.08                       # metres per unit of surface-normal threshold
    R_ARM, R_THIGH, R_SHIN, R_TORSO = 0.045, 0.08, 0.05, 0.11   # metres per unit of 'how far round the limb'

    out = [[(0, 0.0), (0, 0.0)]] * len(me.vertices)
    sculpt = [0.0] * len(me.vertices)
    for v in me.vertices:
        w = parts[v.index]
        if not w:
            continue

        # Skeleton weights only act as a loose guard ("this is roughly the upper
        # arm"); the visible borders all come from the geometric terms below.
        def part(*names):
            return (sum(w.get(n, 0.0) for n in names) - 0.25) * 0.4

        # Mirror everything onto the body's left side (+x).
        p = Vector((abs(v.co.x), v.co.y, v.co.z))
        n = Vector((v.normal.x * (1 if v.co.x >= 0 else -1), v.normal.y, v.normal.z))
        h = (p.z - hip.z) / L            # 0 at the hip joint, 1 at the shoulder joint
        xs = p.x / SW                    # 0 on the midline, 1 at the shoulder joint
        # How far round the torso the point is: 1 = front centre, 0 = side, -1 = back centre.
        yc = hip.y + (sh.y - hip.y) * min(1.0, max(0.0, h))
        fr = -(p.y - yc) / max(1e-6, math.hypot(p.x, p.y - yc))
        torso = part('torso')

        t_arm, r_arm = limb_coords(p, sh, el)
        t_fore, _ = limb_coords(p, el, wr)
        t_leg, r_leg = limb_coords(p, hip, kn)
        t_shin, r_shin = limb_coords(p, kn, an)
        arm_front = r_arm.dot(BICEPS_DIR)
        leg_fwd = r_leg.dot(FWD)

        f = {}
        # deltoid: a ball around the shoulder joint, minus the armpit
        f['Shoulders'] = min(part('upperarm', 'torso'), (0.27 - (p - sh).length / L) * L, (xs - 0.86) * SW,
                             (r_arm.dot(ARM_UP) + 0.35) * R_ARM, (0.42 - t_arm) * AU)
        f['Biceps'] = min(part('upperarm'), band(t_arm, 0.3, 0.97, AU), (arm_front - 0.25) * R_ARM)
        f['Triceps'] = min(part('upperarm'), band(t_arm, 0.3, 0.97, AU), (-0.12 - arm_front) * R_ARM)
        f['Forearms'] = min(part('forearm'), band(t_fore, 0.02, 0.88, AF))

        # quads start a little lower in front, where the hip crease is
        quad_thr = 0.05 + 0.2 * (1 - smoothstep(0.1, 0.3, t_leg))
        f['Quads'] = min(part('thigh'), band(t_leg, 0.1, 0.93, TL), (leg_fwd - quad_thr) * R_THIGH,
                         (r_leg.x + 0.62) * R_THIGH)
        f['Hamstrings'] = min(part('thigh'), band(t_leg, 0.2, 0.93, TL), (-0.2 - leg_fwd) * R_THIGH,
                              (r_leg.x + 0.75) * R_THIGH)
        f['Glutes'] = min(part('torso', 'thigh'), (-0.3 - fr) * R_TORSO, (0.17 - h) * L, (0.2 - t_leg) * TL,
                          (1.05 - xs) * SW)
        f['Calves'] = min(part('shin'), band(t_shin, 0.04, 0.62, SL), (-0.05 - r_shin.dot(FWD)) * R_SHIN)

        f['Chest'] = min(torso, (fr - 0.1) * R_TORSO, oval(xs, h, 0.48, 0.775, 0.47, 0.2, SW, L))
        f['Abs'] = min(torso, (fr - 0.3) * R_TORSO, oval(xs, h, 0, 0.3, 0.34, 0.29, SW, L))
        f['Obliques'] = min(torso, band(h, 0.06, 0.5, L), (xs - 0.34) * SW, (fr + 0.15) * R_TORSO)
        f['Lower Back'] = min(torso, (-0.3 - fr) * R_TORSO, oval(xs, h, 0, 0.32, 0.4, 0.16, SW, L))
        # traps: a kite from the neck out to the shoulders and down the spine,
        # plus the top of the shoulders between neck and shoulder joint
        kite = smoothstep(0.5, 1.02, h) * 0.95 + 0.04
        f['Traps'] = max(
            min(part('torso', 'neck'), (-0.25 - fr) * R_TORSO, band(h, 0.5, 1.32, L), (kite - xs) * SW),
            min(part('torso', 'neck'), (n.z - 0.45) * NRM, (h - 0.98) * L, (0.88 - xs) * SW, (n.y + 0.35) * NRM,
                neck.z + 0.25 * L - p.z),
        )
        f['Lats'] = min(torso, band(h, 0.24, 0.9, L), (1.0 - xs) * SW, (0.1 - fr) * R_TORSO)

        # carve lower-priority regions back from higher-priority ones
        done = []
        for name in PRIORITY:
            for higher in done:
                f[name] = min(f[name], -f[higher] - GAP)
            done.append(name)

        # Keep the two strongest muscles here, so both sides of a shared border
        # know exactly where it runs.
        ranked = sorted((name for name in f if name in ID), key=f.get, reverse=True)[:2]
        pairs = [(ID[name], min(1.0, max(0.0, 0.5 + f[name] / (2 * EDGE)))) for name in ranked]
        out[v.index] = [(m, wt) if wt > 0 else (0, 0.0) for m, wt in pairs]

        # --- sculpting: raise each muscle's belly, then cut the lines that define it ---
        d = sum(amp * smoothstep(-0.015, 0.05, f[name]) for name, amp in belly.items())
        inside = lambda name: smoothstep(-0.005, 0.015, f[name])
        # six-pack: a centre line and three cross lines
        rows = sum(bump((h - hk) * L, 0.009) for hk in (0.17, 0.3, 0.43))
        d -= 0.004 * inside('Abs') * min(1.0, rows + bump(p.x, 0.008))
        # the groove along the spine
        if torso > 0:
            d -= 0.003 * smoothstep(0.3, 0.6, -fr) * bump(p.x, 0.014) * smoothstep(0.15, 0.3, h) * (1 - smoothstep(0.95, 1.1, h))
        # the two columns of muscle either side of the spine
        d += 0.004 * inside('Lower Back') * bump(xs - 0.2, 0.12)
        # the line down the middle of the hamstrings
        # quads: the three heads you can see — a ridge down the front, the outer
        # sweep, and the teardrop above the inside of the knee
        d += 0.005 * inside('Quads') * (
            bump(r_leg.x - 0.1, 0.22) * smoothstep(0.12, 0.3, t_leg) * (1 - smoothstep(0.65, 0.85, t_leg))
            + bump(r_leg.x - 0.8, 0.25) * smoothstep(0.25, 0.45, t_leg) * (1 - smoothstep(0.8, 0.95, t_leg))
            + 1.2 * bump(r_leg.x + 0.5, 0.28) * bump(t_leg - 0.8, 0.13))
        d -= 0.003 * inside('Hamstrings') * bump(r_leg.x, 0.16)
        # calf: the split between its two heads, in the upper half
        d -= 0.002 * inside('Calves') * bump(r_shin.x, 0.16) * (1 - smoothstep(0.3, 0.5, t_shin))
        sculpt[v.index] = d
    return out, sculpt


def strip_helpers(obj):
    """Keeps the body and the eyeballs and drops every other helper."""
    keep = set(group_members(obj, 'body')) | set(group_members(obj, 'helper-l-eye')) | set(group_members(obj, 'helper-r-eye'))
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.index not in keep], context='VERTS')
    bm.to_mesh(me)
    bm.free()
    for uv in list(me.uv_layers):
        me.uv_layers.remove(uv)
    me.update()


def subdivide(obj):
    """One level of smooth subdivision: enough vertices to carry muscle definition."""
    mod = obj.modifiers.new('subdivide', 'SUBSURF')
    mod.levels = 1
    bpy.ops.object.modifier_apply(modifier=mod.name)


def finish(obj, ids, sculpt):
    """Applies the sculpting, stores the muscle data and triangulates."""
    me = obj.data
    for v in me.vertices:
        v.co += v.normal * sculpt[v.index]
    # Two floats per vertex (strongest and second muscle): the muscle id in the
    # integer part, the weight (0..1) in the fraction.
    for k, name in enumerate(('_MUSCLE', '_MUSCLE2')):
        layer = me.attributes.new(name, 'FLOAT', 'POINT')
        for i, pairs in enumerate(ids):
            m, weight = pairs[k]
            layer.data[i].value = m + min(weight, 1.0) * 0.98
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bm.to_mesh(me)
    bm.free()
    obj.vertex_groups.clear()
    for poly in me.polygons:
        poly.use_smooth = True
    me.update()


def render_preview(obj, path, plain=False):
    import numpy as np
    me = obj.data
    col = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    mus = me.attributes['_MUSCLE'].data
    for i in range(len(me.vertices)):
        val = mus[i].value
        c = PREVIEW_COLORS[int(val) if val - int(val) >= 0.49 and not plain else 0]
        col.data[i].color = (*c, 1.0)
    me.color_attributes.active_color = col

    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.color_type = 'VERTEX'
    scene.render.resolution_x, scene.render.resolution_y = 520, 900
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new('w')
    cam_data = bpy.data.cameras.new('cam')
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 1.85
    cam = bpy.data.objects.new('cam', cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    height = max(v.co.z for v in me.vertices)
    tiles = []
    for k, ang in enumerate([0, 180, 90, 40]):
        a = math.radians(ang)
        cam.location = (math.sin(a) * 4, -math.cos(a) * 4, height / 2)
        cam.rotation_euler = (math.radians(90), 0, a)
        scene.render.filepath = f'{path}.{k}.png'
        bpy.ops.render.render(write_still=True)
        img = bpy.data.images.load(scene.render.filepath)
        px = np.array(img.pixels[:]).reshape(img.size[1], img.size[0], 4)
        tiles.append(px)
        bpy.data.images.remove(img)
        os.remove(scene.render.filepath)
    sheet = np.concatenate(tiles, axis=1)
    out = bpy.data.images.new('sheet', sheet.shape[1], sheet.shape[0], alpha=True)
    out.pixels = sheet.ravel()
    out.filepath_raw = path
    out.file_format = 'PNG'
    out.save()
    me.color_attributes.remove(col)


def main():
    args = parse_args()
    obj = create_body(args.type)
    neutralise(obj)
    lm = landmarks(obj)
    add_part_groups(obj)
    lower_arms(obj, lm)
    strip_helpers(obj)
    subdivide(obj)
    belly = {**BELLY, **BODY_TYPES[args.type].get('belly', {})}
    ids, sculpt = classify(obj, lm, read_part_groups(obj), belly)
    finish(obj, ids, sculpt)
    counts = {MUSCLES[i]: 0 for i in range(1, len(MUSCLES))}
    for d in obj.data.attributes['_MUSCLE'].data:
        if d.value - int(d.value) >= 0.49:
            counts[MUSCLES[int(d.value)]] += 1
    print('MUSCLE_VERTS', counts, 'TOTAL', len(obj.data.vertices), 'TRIS', len(obj.data.polygons))
    if args.preview:
        render_preview(obj, os.path.abspath(args.preview), args.plain)
    if args.out:
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.ops.export_scene.gltf(
            filepath=os.path.abspath(args.out), export_format='GLB', use_selection=True,
            export_attributes=True, export_normals=False, export_texcoords=False,
            export_materials='NONE', export_yup=True, export_apply=True,
        )
        print('EXPORTED', args.out, os.path.getsize(os.path.abspath(args.out)))


main()
