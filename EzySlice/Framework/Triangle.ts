namespace EzySlice {
    import Vector3 = Laya.Vector3;
    import Vector2 = Laya.Vector2;
    import Vector4 = Laya.Vector4;
    /**
     * Represents a simple 3D Triangle structure with position
     * and UV map. The UV is required if the slicer needs
     * to recalculate the new UV position for texture mapping.
     */
    export class Triangle {
        // the points which represent this triangle
        // these have to be set and are immutable. Cannot be
        // changed once set
        private m_pos_a: Vector3;
        private m_pos_b: Vector3;
        private m_pos_c: Vector3;

        // the UV coordinates of this triangle
        // these are optional and may not be set
        private m_uv_set: boolean;
        private m_uv_a: Vector2;
        private m_uv_b: Vector2;
        private m_uv_c: Vector2;

        // the Normals of the Vertices
        // these are optional and may not be set
        private m_nor_set: boolean;
        private m_nor_a: Vector3;
        private m_nor_b: Vector3;
        private m_nor_c: Vector3;

        // the Tangents of the Vertices
        // these are optional and may not be set
        private m_tan_set: boolean;
        private m_tan_a: Vector4;
        private m_tan_b: Vector4;
        private m_tan_c: Vector4;

        constructor(posa: Vector3,
            posb: Vector3,
            posc: Vector3) {
            this.m_pos_a = posa;
            this.m_pos_b = posb;
            this.m_pos_c = posc;

            this.m_uv_set = false;
            this.m_uv_a = Vector2.ZERO;
            this.m_uv_b = Vector2.ZERO;
            this.m_uv_c = Vector2.ZERO;

            this.m_nor_set = false;
            this.m_nor_a = new Vector3();
            this.m_nor_b = new Vector3();
            this.m_nor_c = new Vector3();

            this.m_tan_set = false;
            this.m_tan_a = Vector4.ZERO;
            this.m_tan_b = Vector4.ZERO;
            this.m_tan_c = Vector4.ZERO;
        }

        get positionA(): Vector3 {
            return this.m_pos_a;
        }

        get positionB(): Vector3 {
            return this.m_pos_b;
        }

        get positionC(): Vector3 {
            return this.m_pos_c;
        }

        hasUV(): boolean {
            return this.m_uv_set;
        }

        SetUV(uvA: Vector2, uvB: Vector2, uvC: Vector2) {
            this.m_uv_a = uvA;
            this.m_uv_b = uvB;
            this.m_uv_c = uvC;

            this.m_uv_set = true;
        }

        get uvA(): Vector2 {
            return this.m_uv_a;
        }

        get uvB(): Vector2 {
            return this.m_uv_b;
        }

        get uvC(): Vector2 {
            return this.m_uv_c;
        }

        get hasNormal(): boolean {
            return this.m_nor_set;
        }

        SetNormal(norA: Vector3, norB: Vector3, norC: Vector3) {
            this.m_nor_a = norA;
            this.m_nor_b = norB;
            this.m_nor_c = norC;

            this.m_nor_set = true;
        }

        get normalA(): Vector3 {
            return this.m_nor_a;
        }

        get normalB(): Vector3 {
            return this.m_nor_b;
        }

        get normalC(): Vector3 {
            return this.m_nor_c;
        }

        get hasTangent(): boolean {
            return this.m_tan_set;
        }

        SetTangent(tanA: Vector4, tanB: Vector4, tanC: Vector4) {
            this.m_tan_a = tanA;
            this.m_tan_b = tanB;
            this.m_tan_c = tanC;

            this.m_tan_set = true;
        }

        get tangentA(): Vector4 {
            return this.m_tan_a;
        }

        get tangentB(): Vector4 {
            return this.m_tan_b;
        }

        get tangentC(): Vector4 {
            return this.m_tan_c;
        }

        /**
         * Compute and set the tangents of this triangle
         * Derived From https://answers.unity.com/questions/7789/calculating-tangents-vector4.html
         */
        ComputeTangents() {
            // computing tangents requires both UV and normals set
            if (!this.m_nor_set || !this.m_uv_set) {
                return;
            }

            let v1: Vector3 = this.m_pos_a;
            let v2: Vector3 = this.m_pos_b;
            let v3: Vector3 = this.m_pos_c;

            let w1: Vector2 = this.m_uv_a;
            let w2: Vector2 = this.m_uv_b;
            let w3: Vector2 = this.m_uv_c;

            let x1: number = v2.x - v1.x;
            let x2: number = v3.x - v1.x;
            let y1: number = v2.y - v1.y;
            let y2: number = v3.y - v1.y;
            let z1: number = v2.z - v1.z;
            let z2: number = v3.z - v1.z;

            let s1: number = w2.x - w1.x;
            let s2: number = w3.x - w1.x;
            let t1: number = w2.y - w1.y;
            let t2: number = w3.y - w1.y;

            let r: number = 1.0 / (s1 * t2 - s2 * t1);

            let sdir: Vector3 = new Vector3((t2 * x1 - t1 * x2) * r, (t2 * y1 - t1 * y2) * r, (t2 * z1 - t1 * z2) * r);
            let tdir: Vector3 = new Vector3((s1 * x2 - s2 * x1) * r, (s1 * y2 - s2 * y1) * r, (s1 * z2 - s2 * z1) * r);

            let n1: Vector3 = this.m_nor_a;
            let nt1: Vector3 = sdir;

            this.OrthoNormalize(n1, nt1);
            let outCross: Vector3;
            Vector3.cross(n1, nt1, outCross);
            let tanA: Vector4 = new Vector4(nt1.x, nt1.y, nt1.z, (Vector3.dot(outCross, tdir) < 0.0) ? -1.0 : 1.0);

            let n2: Vector3 = this.m_nor_b;
            let nt2: Vector3 = sdir;
            Vector3.normalize(n2, n2);

            this.OrthoNormalize(n2, nt2);
            Vector3.cross(n2, nt2, outCross);
            let tanB: Vector4 = new Vector4(nt2.x, nt2.y, nt2.z, (Vector3.dot(outCross, tdir) < 0.0) ? -1.0 : 1.0);

            let n3: Vector3 = this.m_nor_c;
            let nt3: Vector3 = sdir;

            this.OrthoNormalize(n3, nt3);
            Vector3.cross(n3, nt3, outCross);
            let tanC: Vector4 = new Vector4(nt3.x, nt3.y, nt3.z, (Vector3.dot(outCross, tdir) < 0.0) ? -1.0 : 1.0);

            // finally set the tangents of this object
            this.SetTangent(tanA, tanB, tanC);
        }

        /**
         * Calculate the Barycentric coordinate weight values u-v-w for Point p in respect to the provided
         * triangle. This is useful for computing new UV coordinates for arbitrary points.
         */
        public Barycentric(p: Vector3): Vector3 {
            let a: Vector3 = this.m_pos_a;
            let b: Vector3 = this.m_pos_b;
            let c: Vector3 = this.m_pos_c;

            let m: Vector3 = new Vector3();
            let subA: Vector3 = new Vector3();
            let subB: Vector3 = new Vector3();
            Vector3.subtract(b, a, subA);
            Vector3.subtract(c, a, subB);
            Vector3.cross(subA, subB, m);

            let nu: number;
            let nv: number;
            let ood: number;

            let x: number = Math.abs(m.x);
            let y: number = Math.abs(m.y);
            let z: number = Math.abs(m.z);

            // compute areas of plane with largest projections
            if (x >= y && x >= z) {
                // area of PBC in yz plane
                nu = Intersector.TriArea2D(p.y, p.z, b.y, b.z, c.y, c.z);
                // area of PCA in yz plane
                nv = Intersector.TriArea2D(p.y, p.z, c.y, c.z, a.y, a.z);
                // 1/2*area of ABC in yz plane
                ood = 1.0 / m.x;
            }
            else if (y >= x && y >= z) {
                // project in xz plane
                nu = Intersector.TriArea2D(p.x, p.z, b.x, b.z, c.x, c.z);
                nv = Intersector.TriArea2D(p.x, p.z, c.x, c.z, a.x, a.z);
                ood = 1.0 / -m.y;
            }
            else {
                // project in xy plane
                nu = Intersector.TriArea2D(p.x, p.y, b.x, b.y, c.x, c.y);
                nv = Intersector.TriArea2D(p.x, p.y, c.x, c.y, a.x, a.y);
                ood = 1.0 / m.z;
            }

            let u: number = nu * ood;
            let v: number = nv * ood;
            let w: number = 1.0 - u - v;

            return new Vector3(u, v, w);
        }

        /**
         * Generate a set of new UV coordinates for the provided point pt in respect to Triangle.
         * 
         * Uses weight values for the computation, so this triangle must have UV's set to return
         * the correct results. Otherwise Vector2.zero will be returned. check via hasUV().
         */
        public GenerateUV(pt: Vector3): Vector2 {
            // if not set, result will be zero, quick exit
            if (!this.m_uv_set) {
                return Vector2.ZERO;
            }

            let weights: Vector3 = this.Barycentric(pt);
            let vec2a: Vector2 = new Vector2();
            Vector2.scale(this.m_uv_a, weights.x, vec2a);
            let vec2b: Vector2 = new Vector2();
            Vector2.scale(this.m_uv_b, weights.y, vec2b);
            let vec2c: Vector2 = new Vector2();
            Vector2.scale(this.m_uv_c, weights.z, vec2c);
            return new Vector2(vec2a.x + vec2b.x + vec2c.x, vec2a.y + vec2b.y + vec2c.y);
        }

        /**
         * Generates a set of new Normal coordinates for the provided point pt in respect to Triangle.
         * 
         * Uses weight values for the computation, so this triangle must have Normal's set to return
         * the correct results. Otherwise Vector3.zero will be returned. check via hasNormal().
         */
        public GenerateNormal(pt: Vector3): Vector3 {
            // if not set, result will be zero, quick exit
            if (!this.m_nor_set) {
                return new Vector3();
            }

            let weights: Vector3 = this.Barycentric(pt);
            let vec3a: Vector3 = new Vector3();
            Vector3.scale(this.m_nor_a, weights.x, vec3a);
            let vec3b: Vector3 = new Vector3();
            Vector3.scale(this.m_nor_b, weights.y, vec3b);
            let vec3c: Vector3 = new Vector3();
            Vector3.scale(this.m_nor_c, weights.z, vec3c);

            return new Vector3(vec3a.x + vec3b.x + vec3c.x, vec3a.y + vec3b.y + vec3c.y, vec3a.z + vec3b.z + vec3c.z);
        }

        /**
         * Generates a set of new Tangent coordinates for the provided point pt in respect to Triangle.
         * 
         * Uses weight values for the computation, so this triangle must have Tangent's set to return
         * the correct results. Otherwise Vector4.zero will be returned. check via hasTangent().
         */
        public GenerateTangent(pt: Vector3): Vector4 {
            // if not set, result will be zero, quick exit
            if (!this.m_nor_set) {
                return Vector4.ZERO;
            }

            let weights: Vector3 = this.Barycentric(pt);
            let vec4a: Vector4 = new Vector4();
            Vector4.scale(this.m_tan_a, weights.x, vec4a);
            let vec4b: Vector4 = new Vector4();
            Vector4.scale(this.m_tan_b, weights.y, vec4b);
            let vec4c: Vector4 = new Vector4();
            Vector4.scale(this.m_tan_c, weights.z, vec4c);

            return new Vector4(vec4a.x + vec4b.x + vec4c.x, vec4a.y + vec4b.y + vec4c.y, vec4a.z + vec4b.z + vec4c.z);
        }

        /**
         * Helper function to split this triangle by the provided plane and store
         * the results inside the IntersectionResult structure.
         * Returns true on success or false otherwise
         */
        public Split(pl: Plane, result: IntersectionResult): boolean {
            Intersector.Intersect(pl, this, result);

            return result.isValid;
        }

        /**
         * Check the triangle winding order, if it's Clock Wise or Counter Clock Wise 
         */
        public IsCW(): boolean {
            return Triangle.SignedSquare(this.m_pos_a, this.m_pos_b, this.m_pos_c) >= Number.EPSILON;
        }

        /**
         * Returns the Signed square of a given triangle, useful for checking the
         * winding order
         */
        public static SignedSquare(a: Vector3, b: Vector3, c: Vector3): number {
            return (a.x * (b.y * c.z - b.z * c.y) -
                a.y * (b.x * c.z - b.z * c.x) +
                a.z * (b.x * c.y - b.y * c.x));
        }
        /**
         * Editor only DEBUG functionality. This should not be compiled in the final
         * Version.
         */
        // public void OnDebugDraw() {
        //     OnDebugDraw(Color.white);
        // }

        // public void OnDebugDraw(Color drawColor) {
        //     #if UNITY_EDITOR
        //     Color prevColor = Gizmos.color;

        //     Gizmos.color = drawColor;

        //     Gizmos.DrawLine(positionA, positionB);
        //     Gizmos.DrawLine(positionB, positionC);
        //     Gizmos.DrawLine(positionC, positionA);

        //     Gizmos.color = prevColor;
        //     #endif
        // }

        OrthoNormalize(normal: Vector3, tangent: Vector3) {
            Vector3.normalize(normal, normal);
            let v: Vector3;
            Vector3.cross(normal, tangent, v);
            Vector3.normalize(v, v);
            Vector3.cross(v, normal, tangent);
        }
        OrthoNormalize1(x: Vector3, y: Vector3, z: Vector3) {
            // Vector3.normalize(x, x);
            // Vector3.cross(z, x, y);
            // Vector3.normalize(y, y);
            // Vector3.cross(x, y, z);
            // Vector3.normalize(z,z);
        }
    }
}