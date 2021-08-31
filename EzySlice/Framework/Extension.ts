/**
 * Define our TextureRegion extension to easily calculate
 * from a Texture2D Object.
 */
declare global {
    namespace Laya {
        import TextureRegion = EzySlice.TextureRegion;
        import SlicedHull = EzySlice.SlicedHull;
        import Plane = EzySlice.Plane;
        interface Texture2D {
            GetTextureRegion(pixX: number, pixY: number, pixWidth: number, pixHeight: number): TextureRegion;
        }
        interface Material {
            albedoTexture: Texture2D;
            GetTextureRegion(pixX: number, pixY: number, pixWidth: number, pixHeight: number): TextureRegion;
        }
        interface MeshSprite3D {
            Slice(pl_position: Plane | Vector3, crossSectionMaterial_direction_textureRegion: Material | Vector3 | TextureRegion, textureRegion_crossSectionMaterial?: TextureRegion | Material, crossSectionMaterial?: Material): SlicedHull;
            SliceInstantiate(pl_position: Plane | Vector3, crossSectionMaterial_direction_cuttingRegion?: Material | Vector3 | TextureRegion, cuttingRegion_crossSectionMaterial?: TextureRegion | Material, crossSectionMaterial?: Material): MeshSprite3D[];
        }
    }
}
Laya.Material.prototype.GetTextureRegion = function (this: Laya.Material, pixX: number, pixY: number, pixWidth: number, pixHeight: number) {
    return this.albedoTexture.GetTextureRegion(pixX, pixY, pixWidth, pixHeight);
}
Laya.Texture2D.prototype.GetTextureRegion = function (this: Laya.Texture2D, pixX: number, pixY: number, pixWidth: number, pixHeight: number) {
    let textureWidth: number = this.width;
    let textureHeight: number = this.height;

    // ensure we are not referencing out of bounds coordinates
    // relative to our texture
    let calcWidth: number = Math.min(textureWidth, pixWidth);
    let calcHeight: number = Math.min(textureHeight, pixHeight);
    let calcX: number = Math.min(Math.abs(pixX), textureWidth);
    let calcY: number = Math.min(Math.abs(pixY), textureHeight);

    let startX: number = calcX / textureWidth;
    let startY: number = calcY / textureHeight;
    let endX: number = (calcX + calcWidth) / textureWidth;
    let endY: number = (calcY + calcHeight) / textureHeight;

    // texture region is a struct which is allocated on the stack
    return new EzySlice.TextureRegion(startX, startY, endX, endY);
};

Laya.MeshSprite3D.prototype.Slice = function (this: Laya.MeshSprite3D, pl_position: EzySlice.Plane | Laya.Vector3, crossSectionMaterial_direction_textureRegion: Laya.Material | Laya.Vector3 | EzySlice.TextureRegion, textureRegion_crossSectionMaterial?: EzySlice.TextureRegion | Laya.Material, crossSectionMaterial?: Laya.Material): EzySlice.SlicedHull {
    if (crossSectionMaterial_direction_textureRegion instanceof Laya.Material) {
        return this.Slice(pl_position as EzySlice.Plane, new EzySlice.TextureRegion(0.0, 0.0, 1.0, 1.0), crossSectionMaterial);
    } else if (textureRegion_crossSectionMaterial instanceof Laya.Material && pl_position instanceof Laya.Vector3) {
        return this.Slice(pl_position, crossSectionMaterial_direction_textureRegion, new EzySlice.TextureRegion(0.0, 0.0, 1.0, 1.0), crossSectionMaterial);
    } else if (textureRegion_crossSectionMaterial instanceof EzySlice.TextureRegion) {
        let cuttingPlane: EzySlice.Plane = new EzySlice.Plane();

        let refUp: Laya.Vector3 = this.transform.InverseTransformDirection(direction);
        let refPt: Laya.Vector3 = this.transform.InverseTransformPoint(position);

        cuttingPlane.Compute(refPt, refUp);

        return this.Slice(cuttingPlane, textureRegion_crossSectionMaterial, crossSectionMaterial);
    } else if (crossSectionMaterial_direction_textureRegion instanceof EzySlice.TextureRegion) {
        return EzySlice.Slicer.Slice(this, pl_position as EzySlice.Plane, crossSectionMaterial_direction_textureRegion, textureRegion_crossSectionMaterial, crossSectionMaterial);
    }
}
Laya.MeshSprite3D.prototype.SliceInstantiate = function (this: Laya.MeshSprite3D, pl_position: EzySlice.Plane | Laya.Vector3, crossSectionMaterial_direction_cuttingRegion?: Laya.Material | Laya.Vector3 | EzySlice.TextureRegion, cuttingRegion_crossSectionMaterial?: EzySlice.TextureRegion | Laya.Material, crossSectionMaterial?: Laya.Material): Laya.MeshSprite3D[] {
    if (cuttingRegion_crossSectionMaterial instanceof EzySlice.TextureRegion) {
        let cuttingPlane: EzySlice.Plane = new EzySlice.Plane();

        let refUp: Laya.Vector3 = this.transform.InverseTransformDirection(direction);
        let refPt: Laya.Vector3 = this.transform.InverseTransformPoint(position);

        cuttingPlane.Compute(refPt, refUp);

        return this.SliceInstantiate(cuttingPlane, cuttingRegion_crossSectionMaterial, crossSectionMaterial);
    } else if (crossSectionMaterial_direction_cuttingRegion instanceof EzySlice.TextureRegion) {
        let slice: EzySlice.SlicedHull = EzySlice.Slicer.Slice(this, pl_position as EzySlice.Plane, crossSectionMaterial_direction_cuttingRegion, crossSectionMaterial);

        if (slice == null) {
            return null;
        }

        let upperHull: Laya.MeshSprite3D = slice.CreateUpperHull(this, crossSectionMaterial);
        let lowerHull: Laya.MeshSprite3D = slice.CreateLowerHull(this, crossSectionMaterial);

        let resultArr: Laya.MeshSprite3D[] = [];
        if (upperHull != null && lowerHull != null) {
            resultArr = [upperHull, lowerHull];
            return resultArr;
        }

        // otherwise return only the upper hull
        if (upperHull != null) {
            resultArr = [upperHull];
            return resultArr;
        }

        // otherwise return only the lower hull
        if (lowerHull != null) {
            resultArr = [lowerHull];
            return resultArr;
        }
        // nothing to return, so return nothing!
        return null;
    } else if (crossSectionMaterial_direction_cuttingRegion instanceof Laya.Vector3 && cuttingRegion_crossSectionMaterial instanceof Laya.Material) {
        return this.SliceInstantiate(pl_position, crossSectionMaterial_direction_cuttingRegion, new EzySlice.TextureRegion(0.0, 0.0, 1.0, 1.0), cuttingRegion_crossSectionMaterial);
    } else if (pl_position instanceof Laya.Vector3 && crossSectionMaterial_direction_cuttingRegion instanceof Laya.Vector3) {
        return this.SliceInstantiate(pl_position, crossSectionMaterial_direction_cuttingRegion, null);
    } else {
        return this.SliceInstantiate(pl_position, new EzySlice.TextureRegion(0.0, 0.0, 1.0, 1.0));
    }
}
export { };