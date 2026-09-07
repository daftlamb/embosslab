# Texture Assets

`white-plaster-02-*` uses the 1K diffuse and bump maps from Poly Haven's
`white_plaster_02` texture asset.

Poly Haven assets are released under CC0:
https://polyhaven.com/license

## Weathered stone and natural leather

The `sandstone_cracks-*` and `brown_leather-*` files are original 1K JPG
Diffuse, OpenGL normal, Roughness and AO maps by Rob Tuytel / Poly Haven.
Downloaded on 2026-09-06 and checked against the API's MD5 checksums.

- https://polyhaven.com/a/sandstone_cracks
- https://polyhaven.com/a/brown_leather
- License: CC0, https://polyhaven.com/license

These files ship locally for offline material rendering. Color is normalized
to the editable surface color; normals and roughness affect lighting. The
weathering control combines map variation and AO with relief concavity.
These are surface shading maps, not additional geometry in height-map exports.

## Full material set and sheen update

All texture files are bundled locally. Sources and creation methods:

| Files | Used for | Source / license |
| --- | --- | --- |
| `white_plaster_02-*` | Plaster pores | [Poly Haven](https://polyhaven.com/a/white_plaster_02), CC0 |
| `Paper001-*` | Paper fibers | [ambientCG Paper001](https://ambientcg.com/a/Paper001), photo-derived / approximated PBR, CC0 |
| `Metal009-*` | Aluminium, chrome and stylized chrome micro-scratches | [ambientCG Metal009](https://ambientcg.com/a/Metal009), authored PBR, CC0 |
| `Foil002-*` | Gold foil wrinkles | [ambientCG Foil002](https://ambientcg.com/a/Foil002), PBR maps, CC0 |
| `Metal063-*` | Aged iron | [ambientCG Metal063](https://ambientcg.com/a/Metal063), photo-derived / approximated PBR, CC0 |
| `ceramic-*` | Porcelain glaze | [TextureCan Tiles0060](https://www.texturecan.com/details/413/), authored PBR, CC0 |
| `wax-*` | Wax flow texture | [TextureCan Others0014](https://www.texturecan.com/details/225/), authored PBR, CC0 |

License references: https://docs.ambientcg.com/license/ and https://www.texturecan.com/terms/.
These are a mixture of photo-derived and authored materials, not all physical scans.
Normal maps use OpenGL tangent-space conventions. Missing AO maps are neutral,
not replaced with color maps. Ceramic samples a mirrored interior patch of one
tile (UV 0.014, 0.014, 0.072, 0.072), excluding grout; its effective detail
resolution is therefore lower than the full source image. Original files remain
unaltered. Normal PNGs for ceramic and wax preserve their source format.

Surface sheen is an artistic softbox / coating approximation, not a full PBR
renderer or a measured environment capture. It uses the surface normal, map
roughness, relief height and grime to vary the highlight. Wax has a subtle
color-dependent fill approximation, not volumetric subsurface scattering.
Metal reflection size, variation and rotation remain editable. Pattern texture
and reflection coordinates are periodic within each repeat unit.
