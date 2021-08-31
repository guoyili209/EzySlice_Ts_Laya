
namespace EzySlice {
    import MeshSprite3D = Laya.MeshSprite3D;
    import Material = Laya.Material;;
    import MeshFilter = Laya.MeshFilter;
    import MeshRenderer = Laya.MeshRenderer;
    import Mesh = Laya.Mesh;
    import Vector3 = Laya.Vector3;
    import Vector2 = Laya.Vector2;
    import Vector4 = Laya.Vector4;
    /**
     * Contains methods for slicing GameObjects
     */
    export class Slicer {

        /**
         * Helper function to accept a gameobject which will transform the plane
         * approprietly before the slice occurs
         * See -> Slice(Mesh, Plane) for more info
         */
        public static Slice(obj: MeshSprite3D, pl: Plane, crossRegion: TextureRegion, crossMaterial: Material): SlicedHull;

        /**
         * Slice the gameobject mesh (if any) using the Plane, which will generate
         * a maximum of 2 other Meshes.
         * This function will recalculate new UV coordinates to ensure textures are applied
         * properly.
         * Returns null if no intersection has been found or the GameObject does not contain
         * a valid mesh to cut.
         */
        public static Slice(sharedMesh: Mesh, pl: Plane, region: TextureRegion, crossIndex: number): SlicedHull;
        public static Slice(sharedMesh_or_obj: MeshSprite3D | Mesh, pl: Plane, crossRegion: TextureRegion, crossMaterial_or_crossIndex: Material | number): SlicedHull {
            if (typeof crossMaterial_or_crossIndex == 'number') {
                if (sharedMesh_or_obj == null) {
                    return null;
                }
                sharedMesh_or_obj = sharedMesh_or_obj as Mesh;
                let verts: Vector3[] = [];
                sharedMesh_or_obj.getPositions(verts);
                let uv: Vector2[] = [];
                sharedMesh_or_obj.getUVs(uv);
                let norm: Vector3[] = [];
                sharedMesh_or_obj.getNormals(norm);
                let tan: Vector4[] = [];
                sharedMesh_or_obj.getTangents(tan);

                let submeshCount: number = sharedMesh_or_obj.subMeshCount;

                // each submesh will be sliced and placed in its own array structure
                let slices: SlicedSubmesh[] = new SlicedSubmesh[submeshCount];
                // the cross section hull is common across all submeshes
                let crossHull: Array<Vector3> = new Array<Vector3>();

                // we reuse this object for all intersection tests
                let result: IntersectionResult = new IntersectionResult();

                // see if we would like to split the mesh using uv, normals and tangents
                let genUV: boolean = verts.length == uv.length;
                let genNorm: boolean = verts.length == norm.length;
                let genTan: boolean = verts.length == tan.length;

                // iterate over all the submeshes individually. vertices and indices
                // are all shared within the submesh
                for (let submesh: number = 0; submesh < submeshCount; submesh++) {
                    let indices: Uint32Array = sharedMesh_or_obj.getSubMesh(submesh).getIndices() as Uint32Array;
                    let indicesCount: number = indices.length;

                    let mesh: SlicedSubmesh = new SlicedSubmesh();

                    // loop through all the mesh vertices, generating upper and lower hulls
                    // and all intersection points
                    for (let index: number = 0; index < indicesCount; index += 3) {
                        let i0: number = indices[index + 0];
                        let i1: number = indices[index + 1];
                        let i2: number = indices[index + 2];

                        let newTri: Triangle = new Triangle(verts[i0], verts[i1], verts[i2]);

                        // generate UV if available
                        if (genUV) {
                            newTri.SetUV(uv[i0], uv[i1], uv[i2]);
                        }

                        // generate normals if available
                        if (genNorm) {
                            newTri.SetNormal(norm[i0], norm[i1], norm[i2]);
                        }

                        // generate tangents if available
                        if (genTan) {
                            newTri.SetTangent(tan[i0], tan[i1], tan[i2]);
                        }

                        // slice this particular triangle with the provided
                        // plane
                        if (newTri.Split(pl, result)) {
                            let upperHullCount: number = result.upperHullCount;
                            let lowerHullCount: number = result.lowerHullCount;
                            let interHullCount: number = result.intersectionPointCount;

                            for (let i: number = 0; i < upperHullCount; i++) {
                                mesh.upperHull.push(result.upperHull[i]);
                            }

                            for (let i: number = 0; i < lowerHullCount; i++) {
                                mesh.lowerHull.push(result.lowerHull[i]);
                            }

                            for (let i: number = 0; i < interHullCount; i++) {
                                crossHull.push(result.intersectionPoints[i]);
                            }
                        }
                        else {
                            let side: SideOfPlane = pl.SideOf(verts[i0]);

                            if (side == SideOfPlane.UP || side == SideOfPlane.ON) {
                                mesh.upperHull.push(newTri);
                            }
                            else {
                                mesh.lowerHull.push(newTri);
                            }
                        }
                    }

                    // register into the index
                    slices[submesh] = mesh;
                }

                // check if slicing actually occured
                for (let i: number = 0; i < slices.length; i++) {
                    // check if at least one of the submeshes was sliced. If so, stop checking
                    // because we need to go through the generation step
                    if (slices[i] != null && slices[i].isValid) {
                        return this.CreateFrom(slices, this.CreateFrom(crossHull, pl.normal, crossRegion), crossMaterial_or_crossIndex);
                    }
                }

                // no slicing occured, just return null to signify
                return null;
            } else {
                sharedMesh_or_obj = (sharedMesh_or_obj as MeshSprite3D);
                crossMaterial_or_crossIndex = crossMaterial_or_crossIndex as Material;
                let filter: MeshFilter = sharedMesh_or_obj.meshFilter;

                // cannot continue without a proper filter
                if (filter == null) {
                    console.warn("EzySlice::Slice -> Provided GameObject must have a MeshFilter Component.");

                    return null;
                }

                let renderer: MeshRenderer = sharedMesh_or_obj.meshRenderer;

                // cannot continue without a proper renderer
                if (renderer == null) {
                    console.warn("EzySlice::Slice -> Provided GameObject must have a MeshRenderer Component.");

                    return null;
                }

                let materials: Material[] = renderer.sharedMaterials;

                let mesh: Mesh = filter.sharedMesh;

                // cannot slice a mesh that doesn't exist
                if (mesh == null) {
                    console.warn("EzySlice::Slice -> Provided GameObject must have a Mesh that is not NULL.");

                    return null;
                }

                let submeshCount: number = mesh.subMeshCount;

                // to make things straightforward, exit without slicing if the materials and mesh
                // array don't match. This shouldn't happen anyway
                if (materials.length != submeshCount) {
                    console.warn("EzySlice::Slice -> Provided Material array must match the length of submeshes.");

                    return null;
                }

                // we need to find the index of the material for the cross section.
                // default to the end of the array
                let crossIndex: number = materials.length;

                // for cases where the sliced material is null, we will append the cross section to the end
                // of the submesh array, this is because the application may want to set/change the material
                // after slicing has occured, so we don't assume anything
                if (crossMaterial_or_crossIndex != null) {
                    for (let i: number = 0; i < crossIndex; i++) {
                        if (materials[i] == crossMaterial_or_crossIndex) {
                            crossIndex = i;
                            break;
                        }
                    }
                }

                return this.Slice(mesh, pl, crossRegion, crossIndex);
            }
        }
        /**
         * Generate Two Meshes (an upper and lower) cross section from a set of intersection
         * points and a plane normal. Intersection Points do not have to be in order.
         */
        private static CreateFrom(intPoints: Array<Vector3>, planeNormal: Vector3, region: TextureRegion): Array<Triangle>;

        /**
         * Generates a single SlicedHull from a set of cut submeshes 
         */
        private static CreateFrom(meshes: SlicedSubmesh[], cross: Array<Triangle>, crossSectionIndex: number): SlicedHull;
        private static CreateFrom(intPoints_meshes: Array<Vector3> | SlicedSubmesh[], planeNormal_cross: Vector3 | Array<Triangle>, region_crossSectionIndex: TextureRegion | number): Array<Triangle> | SlicedHull {
            if (typeof region_crossSectionIndex == 'number') {
                let submeshCount: number = intPoints_meshes.length;

                let upperHullCount: number = 0;
                let lowerHullCount: number = 0;

                // get the total amount of upper, lower and intersection counts
                for (let submesh: number = 0; submesh < submeshCount; submesh++) {
                    upperHullCount += (intPoints_meshes[submesh] as SlicedSubmesh).upperHull.length;
                    lowerHullCount += (intPoints_meshes[submesh] as SlicedSubmesh).lowerHull.length;
                }

                let upperHull: Mesh = this.CreateUpperHull(intPoints_meshes as SlicedSubmesh[], upperHullCount, planeNormal_cross as Array<Triangle>, region_crossSectionIndex);
                let lowerHull: Mesh = this.CreateLowerHull(intPoints_meshes as SlicedSubmesh[], lowerHullCount, planeNormal_cross as Array<Triangle>, region_crossSectionIndex);

                return new SlicedHull(upperHull, lowerHull);
            } else {
                let tris: Array<Triangle> = new Array<Triangle>();

                if (Triangulator.MonotoneChain(intPoints_meshes as Array<Vector3>, planeNormal_cross as Vector3, tris, region_crossSectionIndex)) {
                    return tris;
                }

                return null;
            }
        }

        private static CreateUpperHull(mesh: SlicedSubmesh[], total: number, crossSection: Array<Triangle>, crossSectionIndex: number): Mesh {
            return this.CreateHull(mesh, total, crossSection, crossSectionIndex, true);
        }

        private static CreateLowerHull(mesh: SlicedSubmesh[], total: number, crossSection: Array<Triangle>, crossSectionIndex: number): Mesh {
            return this.CreateHull(mesh, total, crossSection, crossSectionIndex, false);
        }

        /**
         * Generate a single Mesh HULL of either the UPPER or LOWER hulls. 
         */
        private static CreateHull(meshes: SlicedSubmesh[], total: number, crossSection: Array<Triangle>, crossIndex: number, isUpper: boolean): Mesh {
            if (total <= 0) {
                return null;
            }

            let submeshCount: number = meshes.length;
            let crossCount: number = crossSection != null ? crossSection.length : 0;

            let newMesh: Mesh = new Mesh();

            let arrayLen: number = (total + crossCount) * 3;

            let hasUV: boolean = meshes[0].hasUV;
            let hasNormal: boolean = meshes[0].hasNormal;
            let hasTangent: boolean = meshes[0].hasTangent;

            // vertices and uv's are common for all submeshes
            let newVertices: Vector3[] = new Vector3[arrayLen];
            let newUvs: Vector2[] = hasUV ? new Vector2[arrayLen] : null;
            let newNormals: Vector3[] = hasNormal ? new Vector3[arrayLen] : null;
            let newTangents: Vector4[] = hasTangent ? new Vector4[arrayLen] : null;

            // each index refers to our submesh triangles
            let triangles: Array<number[]> = new Array<number[]>(submeshCount);

            let vIndex: number = 0;

            // first we generate all our vertices, uv's and triangles
            for (let submesh: number = 0; submesh < submeshCount; submesh++) {
                // pick the hull we will be playing around with
                let hull: Array<Triangle> = isUpper ? meshes[submesh].upperHull : meshes[submesh].lowerHull;
                let hullCount: number = hull.length;

                let indices: number[] = new Number[hullCount * 3];

                // fill our mesh arrays
                for (let i: number = 0, triIndex = 0; i < hullCount; i++, triIndex += 3) {
                    let newTri: Triangle = hull[i];

                    let i0: number = vIndex + 0;
                    let i1: number = vIndex + 1;
                    let i2: number = vIndex + 2;

                    // add the vertices
                    newVertices[i0] = newTri.positionA;
                    newVertices[i1] = newTri.positionB;
                    newVertices[i2] = newTri.positionC;

                    // add the UV coordinates if any
                    if (hasUV) {
                        newUvs[i0] = newTri.uvA;
                        newUvs[i1] = newTri.uvB;
                        newUvs[i2] = newTri.uvC;
                    }

                    // add the Normals if any
                    if (hasNormal) {
                        newNormals[i0] = newTri.normalA;
                        newNormals[i1] = newTri.normalB;
                        newNormals[i2] = newTri.normalC;
                    }

                    // add the Tangents if any
                    if (hasTangent) {
                        newTangents[i0] = newTri.tangentA;
                        newTangents[i1] = newTri.tangentB;
                        newTangents[i2] = newTri.tangentC;
                    }

                    // triangles are returned in clocwise order from the
                    // intersector, no need to sort these
                    indices[triIndex] = i0;
                    indices[triIndex + 1] = i1;
                    indices[triIndex + 2] = i2;

                    vIndex += 3;
                }

                // add triangles to the index for later generation
                triangles.push(indices);
            }

            // generate the cross section required for this particular hull
            if (crossSection != null && crossCount > 0) {
                let crossIndices: number[] = new Number[crossCount * 3];

                for (let i: number = 0, triIndex = 0; i < crossCount; i++, triIndex += 3) {
                    let newTri: Triangle = crossSection[i];

                    let i0: number = vIndex + 0;
                    let i1: number = vIndex + 1;
                    let i2: number = vIndex + 2;

                    // add the vertices
                    newVertices[i0] = newTri.positionA;
                    newVertices[i1] = newTri.positionB;
                    newVertices[i2] = newTri.positionC;

                    // add the UV coordinates if any
                    if (hasUV) {
                        newUvs[i0] = newTri.uvA;
                        newUvs[i1] = newTri.uvB;
                        newUvs[i2] = newTri.uvC;
                    }

                    // add the Normals if any
                    if (hasNormal) {
                        // invert the normals dependiong on upper or lower hull
                        if (isUpper) {
                            Vector3.subtract(new Vector3(), newTri.normalA, newNormals[i0]);
                            Vector3.subtract(new Vector3(), newTri.normalB, newNormals[i1]);
                            Vector3.subtract(new Vector3(), newTri.normalC, newNormals[i2]);
                        }
                        else {
                            newNormals[i0] = newTri.normalA;
                            newNormals[i1] = newTri.normalB;
                            newNormals[i2] = newTri.normalC;
                        }
                    }

                    // add the Tangents if any
                    if (hasTangent) {
                        newTangents[i0] = newTri.tangentA;
                        newTangents[i1] = newTri.tangentB;
                        newTangents[i2] = newTri.tangentC;
                    }

                    // add triangles in clockwise for upper
                    // and reversed for lower hulls, to ensure the mesh
                    // is facing the right direction
                    if (isUpper) {
                        crossIndices[triIndex] = i0;
                        crossIndices[triIndex + 1] = i1;
                        crossIndices[triIndex + 2] = i2;
                    }
                    else {
                        crossIndices[triIndex] = i0;
                        crossIndices[triIndex + 1] = i2;
                        crossIndices[triIndex + 2] = i1;
                    }

                    vIndex += 3;
                }

                // add triangles to the index for later generation
                if (triangles.length <= crossIndex) {
                    triangles.push(crossIndices);
                }
                else {
                    // otherwise, we need to merge the triangles for the provided subsection
                    let prevTriangles: number[] = triangles[crossIndex];
                    let merged: number[] = new Number[prevTriangles.length + crossIndices.length];

                    merged = prevTriangles.slice(0, prevTriangles.length);
                    merged = merged.concat(crossIndices);


                    // replace the previous array with the new merged array
                    triangles[crossIndex] = merged;
                }
            }

            let totalTriangles: number = triangles.length;

            // newMesh.subMeshCount = totalTriangles;
            // fill the mesh structure
            newMesh.setPositions(newVertices);

            if (hasUV) {
                newMesh.setUVs(newUvs);
            }

            if (hasNormal) {
                newMesh.setNormals(newNormals);
            }

            if (hasTangent) {
                newMesh.setTangents(newTangents);
            }

            // add the submeshes
            let uint32Arr: Uint32Array;
            for (let i: number = 0; i < totalTriangles; i++) {

                let n: number[] = triangles[i];
                uint32Arr = new Uint32Array(triangles[i].length);
                uint32Arr.set(n);
                newMesh.setIndices(uint32Arr);
            }
            return newMesh;
        }

    }

    class SlicedSubmesh {
        public upperHull: Array<Triangle> = new Array<Triangle>();
        public lowerHull: Array<Triangle> = new Array<Triangle>();

        /**
         * Check if the submesh has had any UV's added.
         * NOTE -> This should be supported properly
         */
        get hasUV(): boolean {

            // what is this abomination??
            return this.upperHull.length > 0 ? this.upperHull[0].hasUV() : this.lowerHull.length > 0 ? this.lowerHull[0].hasUV() : false;

        }

        /**
         * Check if the submesh has had any Normals added.
         * NOTE -> This should be supported properly
         */
        get hasNormal(): boolean {

            // what is this abomination??
            return this.upperHull.length > 0 ? this.upperHull[0].hasNormal : this.lowerHull.length > 0 ? this.lowerHull[0].hasNormal : false;

        }

        /**
         * Check if the submesh has had any Tangents added.
         * NOTE -> This should be supported properly
         */
        get hasTangent(): boolean {
            // what is this abomination??
            return this.upperHull.length > 0 ? this.upperHull[0].hasTangent : this.lowerHull.length > 0 ? this.lowerHull[0].hasTangent : false;
        }

        /**
         * Check if proper slicing has occured for this submesh. Slice occured if there
         * are triangles in both the upper and lower hulls
         */
        get isValid(): boolean {
            return this.upperHull.length > 0 && this.lowerHull.length > 0;
        }
    }
}