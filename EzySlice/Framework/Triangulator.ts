namespace EzySlice {
    import Vector3 = Laya.Vector3;
    import Vector2 = Laya.Vector2;
    /**
     * Contains static functionality for performing Triangulation on arbitrary vertices.
     * Read the individual function descriptions for specific details.
     */
    export class Triangulator {
        /**
         * Overloaded variant of MonotoneChain which will calculate UV coordinates of the Triangles
         * between 0.0 and 1.0 (default).
         * 
         * See MonotoneChain(vertices, normal, tri, TextureRegion) for full explanation
         */
        public static MonotoneChain(vertices: Array<Vector3>, normal: Vector3, tri: Array<Triangle>): boolean;
        /**
         * O(n log n) Convex Hull Algorithm. 
         * Accepts a list of vertices as Vector3 and triangulates them according to a projection
         * plane defined as planeNormal. Algorithm will output vertices, indices and UV coordinates
         * as arrays
         */
        public static MonotoneChain(vertices: Array<Vector3>, normal: Vector3, tri: Array<Triangle>, texRegion: TextureRegion): boolean;
        public static MonotoneChain(vertices: Array<Vector3>, normal: Vector3, tri: Array<Triangle>, texRegion?: TextureRegion): boolean {
            if (texRegion) {
                let count: number = vertices.length;

                // we cannot triangulate less than 3 points. Use minimum of 3 points
                if (count < 3) {
                    tri = null;
                    return false;
                }

                // first, we map from 3D points into a 2D plane represented by the provided normal
                let u: Vector3 = new Vector3();
                let crossVec3: Vector3 = new Vector3();
                Vector3.cross(normal, new Vector3(0, 1, 0), crossVec3)
                Vector3.normalize(crossVec3, u);
                if (new Vector3() == u) {
                    Vector3.cross(normal, new Vector3(0, 0, 1), crossVec3)
                    Vector3.normalize(crossVec3, u);
                }
                let v: Vector3 = new Vector3();
                Vector3.cross(u, normal, v);

                // generate an array of mapped values
                let mapped: Mapped2D[] = new Mapped2D[count];

                // these values will be used to generate new UV coordinates later on
                let maxDivX: number = Number.MIN_VALUE;
                let maxDivY: number = Number.MIN_VALUE;
                let minDivX: number = Number.MAX_VALUE;
                let minDivY: number = Number.MAX_VALUE;

                // map the 3D vertices into the 2D mapped values
                for (let i: number = 0; i < count; i++) {
                    let vertToAdd: Vector3 = vertices[i];

                    let newMappedValue: Mapped2D = new Mapped2D(vertToAdd, u, v);
                    let mapVal: Vector2 = newMappedValue.mappedValue;

                    // grab our maximal values so we can map UV's in a proper range
                    maxDivX = Math.max(maxDivX, mapVal.x);
                    maxDivY = Math.max(maxDivY, mapVal.y);
                    minDivX = Math.min(minDivX, mapVal.x);
                    minDivY = Math.min(minDivY, mapVal.y);

                    mapped[i] = newMappedValue;
                }

                // sort our newly generated array values
                mapped.sort((a, b) => {
                    let x: Vector2 = a.mappedValue;
                    let p: Vector2 = b.mappedValue;

                    return (x.x < p.x || (x.x == p.x && x.y < p.y)) ? -1 : 1;
                });

                // our final hull mappings will end up in here
                let hulls: Mapped2D[] = new Mapped2D[count + 1];

                let k: number = 0;

                // build the lower hull of the chain
                for (let i: number = 0; i < count; i++) {
                    while (k >= 2) {
                        let mA: Vector2 = hulls[k - 2].mappedValue;
                        let mB: Vector2 = hulls[k - 1].mappedValue;
                        let mC: Vector2 = mapped[i].mappedValue;

                        if (Intersector.TriArea2D(mA.x, mA.y, mB.x, mB.y, mC.x, mC.y) > 0.0) {
                            break;
                        }

                        k--;
                    }

                    hulls[k++] = mapped[i];
                }

                // build the upper hull of the chain
                for (let i: number = count - 2, t = k + 1; i >= 0; i--) {
                    while (k >= t) {
                        let mA: Vector2 = hulls[k - 2].mappedValue;
                        let mB: Vector2 = hulls[k - 1].mappedValue;
                        let mC: Vector2 = mapped[i].mappedValue;

                        if (Intersector.TriArea2D(mA.x, mA.y, mB.x, mB.y, mC.x, mC.y) > 0.0) {
                            break;
                        }

                        k--;
                    }

                    hulls[k++] = mapped[i];
                }

                // finally we can build our mesh, generate all the variables
                // and fill them up
                let vertCount: number = k - 1;
                let triCount: number = (vertCount - 2) * 3;

                // this should not happen, but here just in case
                if (vertCount < 3) {
                    tri = null;
                    return false;
                }

                // ensure List does not dynamically grow, performing copy ops each time!
                tri = new Array<Triangle>(triCount / 3);

                let width: number = maxDivX - minDivX;
                let height: number = maxDivY - minDivY;

                let indexCount: number = 1;

                // generate both the vertices and uv's in this loop
                for (let i: number = 0; i < triCount; i += 3) {
                    // the Vertices in our triangle
                    let posA: Mapped2D = hulls[0];
                    let posB: Mapped2D = hulls[indexCount];
                    let posC: Mapped2D = hulls[indexCount + 1];

                    // generate UV Maps
                    let uvA: Vector2 = posA.mappedValue;
                    let uvB: Vector2 = posB.mappedValue;
                    let uvC: Vector2 = posC.mappedValue;

                    uvA.x = (uvA.x - minDivX) / width;
                    uvA.y = (uvA.y - minDivY) / height;

                    uvB.x = (uvB.x - minDivX) / width;
                    uvB.y = (uvB.y - minDivY) / height;

                    uvC.x = (uvC.x - minDivX) / width;
                    uvC.y = (uvC.y - minDivY) / height;

                    let newTriangle: Triangle = new Triangle(posA.originalValue, posB.originalValue, posC.originalValue);

                    // ensure our UV coordinates are mapped into the requested TextureRegion
                    newTriangle.SetUV(texRegion.Map(uvA), texRegion.Map(uvB), texRegion.Map(uvC));

                    // the normals is the same for all vertices since the final mesh is completly flat
                    newTriangle.SetNormal(normal, normal, normal);
                    newTriangle.ComputeTangents();

                    tri.push(newTriangle);

                    indexCount++;
                }

                return true;
            } else {
                return this.MonotoneChain(vertices, normal, tri, new TextureRegion(0.0, 0.0, 1.0, 1.0));
            }
        }
    }
    /**
     * Represents a 3D Vertex which has been mapped onto a 2D surface
     * and is mainly used in MonotoneChain to triangulate a set of vertices
     * against a flat plane.
     */
    class Mapped2D {
        private original: Vector3;
        private mapped: Vector2;

        constructor(newOriginal: Vector3, u: Vector3, v: Vector3) {
            this.original = newOriginal;
            this.mapped = new Vector2(Vector3.dot(newOriginal, u), Vector3.dot(newOriginal, v));
        }

        get mappedValue(): Vector2 {
            return this.mapped;
        }

        get originalValue(): Vector3 {
            return this.original;
        }
    }
}