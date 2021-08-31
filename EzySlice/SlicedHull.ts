
namespace EzySlice {
    import MeshSprite3D = Laya.MeshSprite3D;
    import Material = Laya.Material;
    import MeshRenderer = Laya.MeshRenderer;
    import Mesh = Laya.Mesh;
    /**
     * The final generated data structure from a slice operation. This provides easy access
     * to utility functions and the final Mesh data for each section of the HULL.
     */
    export class SlicedHull {
        private upper_hull: Mesh;
        private lower_hull: Mesh;

        constructor(upperHull: Mesh, lowerHull: Mesh) {
            this.upper_hull = upperHull;
            this.lower_hull = lowerHull;
        }

        public CreateUpperHull(original: MeshSprite3D): MeshSprite3D;

        public CreateUpperHull(original: MeshSprite3D, crossSectionMat: Material);
        public CreateUpperHull(): MeshSprite3D;
        CreateUpperHull(original?: MeshSprite3D, crossSectionMat?: Material): MeshSprite3D {
            if (crossSectionMat) {
                let newObject: MeshSprite3D = this.CreateUpperHull();

                if (newObject != null) {
                    newObject.transform.localPosition = original.transform.localPosition;
                    newObject.transform.localRotation = original.transform.localRotation;
                    newObject.transform.localScale = original.transform.localScale;

                    let shared: Material[] = original.meshRenderer.sharedMaterials;
                    let mesh: Mesh = original.meshFilter.sharedMesh;

                    // nothing changed in the hierarchy, the cross section must have been batched
                    // with the submeshes, return as is, no need for any changes
                    if (mesh.subMeshCount == this.upper_hull.subMeshCount) {
                        // the the material information
                        newObject.meshRenderer.sharedMaterials = shared;

                        return newObject;
                    }

                    // otherwise the cross section was added to the back of the submesh array because
                    // it uses a different material. We need to take this into account
                    let newShared: Material[] = new Material[shared.length + 1];

                    // copy our material arrays across using native copy (should be faster than loop)
                    newShared = shared.slice(0, shared.length);
                    newShared[shared.length] = crossSectionMat;

                    // the the material information
                    newObject.meshRenderer.sharedMaterials = newShared;
                }
                return newObject;
            } else if (original) {
                return this.CreateUpperHull(original, null);
            } else {
                return SlicedHull.CreateEmptyObject("Upper_Hull", this.upper_hull);
            }
        }

        public CreateLowerHull(original: MeshSprite3D): MeshSprite3D;
        public CreateLowerHull(original: MeshSprite3D, crossSectionMat: Material): MeshSprite3D;
        /**
         * Generate a new GameObject from the Lower hull of the mesh
         * This function will return null if lower hull does not exist
         */
        public CreateLowerHull(): MeshSprite3D;
        CreateLowerHull(original?: MeshSprite3D, crossSectionMat?: Material): MeshSprite3D {
            if (crossSectionMat) {
                let newObject: MeshSprite3D = this.CreateLowerHull();

                if (newObject != null) {
                    newObject.transform.localPosition = original.transform.localPosition;
                    newObject.transform.localRotation = original.transform.localRotation;
                    newObject.transform.localScale = original.transform.localScale;

                    let shared: Material[] = original.meshRenderer.sharedMaterials;
                    let mesh: Mesh = original.meshFilter.sharedMesh;

                    // nothing changed in the hierarchy, the cross section must have been batched
                    // with the submeshes, return as is, no need for any changes
                    if (mesh.subMeshCount == this.lower_hull.subMeshCount) {
                        // the the material information
                        newObject.meshRenderer.sharedMaterials = shared;

                        return newObject;
                    }

                    // otherwise the cross section was added to the back of the submesh array because
                    // it uses a different material. We need to take this into account
                    let newShared: Material[] = new Material[shared.length + 1];

                    // copy our material arrays across using native copy (should be faster than loop)
                    newShared = shared.slice(0, shared.length);
                    newShared[shared.length] = crossSectionMat;

                    // the the material information
                    newObject.meshRenderer.sharedMaterials = newShared;
                }

                return newObject;
            } else if (original) {
                return this.CreateLowerHull(original, null);
            } else {
                return SlicedHull.CreateEmptyObject("Lower_Hull", this.lower_hull);
            }
        }

        get upperHull(): Mesh {
            return this.upper_hull;
        }

        get lowerHull(): Mesh {
            return this.lower_hull;
        }

        /**
         * Helper function which will create a new GameObject to be able to add
         * a new mesh for rendering and return.
         */
        private static CreateEmptyObject(name: string, hull: Mesh): MeshSprite3D {
            if (hull == null) {
                return null;
            }

            let newObject: MeshSprite3D = new MeshSprite3D();
            newObject.name = name;
            // newObject.AddComponent<MeshRenderer>();
            // MeshFilter filter = newObject.AddComponent<MeshFilter>();
            newObject.meshFilter.sharedMesh = hull;
            return newObject;
        }
    }
}