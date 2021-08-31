namespace EzySlice {
    import Vector3 = Laya.Vector3;
    import Vector2 = Laya.Vector2;
    import Vector4 = Laya.Vector4;
    /**
     * Contains static functionality to perform geometric intersection tests.
     */
    export class Intersector {
        public static Intersect(pl: Plane, ln: Line, q: Vector3): boolean;
        public static Intersect(pl: Plane, a: Vector3, b: Vector3, q: Vector3): boolean;
        public static Intersect(pl: Plane, tri: Triangle, result: IntersectionResult);
        public static Intersect(pl: Plane, ln_a_tri: Line | Vector3 | Triangle, result_q_b: Vector3 | IntersectionResult, q?: Vector3): boolean {
            if (ln_a_tri instanceof Line) {
                return Intersector.Intersect(pl, ln_a_tri.positionA, ln_a_tri.positionB, result_q_b as Vector3);
            } else if (ln_a_tri instanceof Vector3) {
                let normal: Vector3 = pl.normal;
                let ab: Vector3 = new Vector3();
                Vector3.subtract(result_q_b as Vector3, ln_a_tri, ab);

                let t: number = (pl.dist - Vector3.dot(normal, ln_a_tri)) / Vector3.dot(normal, ab);

                // need to be careful and compensate for floating errors
                if (t >= -Number.EPSILON && t <= (1 + Number.EPSILON)) {
                    let scaleVec3: Vector3 = new Vector3();
                    Vector3.scale(ab, t, scaleVec3);
                    Vector3.add(ln_a_tri, scaleVec3, q);
                    return true;
                }

                q = new Vector3();

                return false;
            } else if (ln_a_tri instanceof Triangle) {
                // clear the previous results from the IntersectionResult
                (result_q_b as IntersectionResult).Clear();

                // grab local variables for easier access
                let a: Vector3 = ln_a_tri.positionA;
                let b: Vector3 = ln_a_tri.positionB;
                let c: Vector3 = ln_a_tri.positionC;

                // check to see which side of the plane the points all
                // lay in. SideOf operation is a simple dot product and some comparison
                // operations, so these are a very quick checks
                let sa: SideOfPlane = pl.SideOf(a);
                let sb: SideOfPlane = pl.SideOf(b);
                let sc: SideOfPlane = pl.SideOf(c);

                // we cannot intersect if the triangle points all fall on the same side
                // of the plane. This is an easy early out test as no intersections are possible.
                if (sa == sb && sb == sc) {
                    return;
                }

                // detect cases where two points lay straight on the plane, meaning
                // that the plane is actually parralel with one of the edges of the triangle
                else if ((sa == SideOfPlane.ON && sa == sb) ||
                    (sa == SideOfPlane.ON && sa == sc) ||
                    (sb == SideOfPlane.ON && sb == sc)) {
                    return;
                }

                // keep in mind that intersection points are shared by both
                // the upper HULL and lower HULL hence they lie perfectly
                // on the plane that cut them
                let qa: Vector3;
                let qb: Vector3;

                // check the cases where the points of the triangle actually lie on the plane itself
                // in these cases, there is only going to be 2 triangles, one for the upper HULL and
                // the other on the lower HULL
                // we just need to figure out which points to accept into the upper or lower hulls.
                if (sa == SideOfPlane.ON) {
                    // if the point a is on the plane, test line b-c
                    if (Intersector.Intersect(pl, b, c, qa)) {
                        // line b-c intersected, construct out triangles and return approprietly
                        (result_q_b as IntersectionResult).AddIntersectionPoint(qa);
                        (result_q_b as IntersectionResult).AddIntersectionPoint(a);

                        // our two generated triangles, we need to figure out which
                        // triangle goes into the UPPER hull and which goes into the LOWER hull
                        let ta: Triangle = new Triangle(a, b, qa);
                        let tb: Triangle = new Triangle(a, qa, c);

                        // generate UV coordinates if there is any
                        if (ln_a_tri.hasUV) {
                            // the computed UV coordinate if the intersection point
                            let pq: Vector2 = ln_a_tri.GenerateUV(qa);
                            let pa: Vector2 = ln_a_tri.uvA;
                            let pb: Vector2 = ln_a_tri.uvB;
                            let pc: Vector2 = ln_a_tri.uvC;

                            ta.SetUV(pa, pb, pq);
                            tb.SetUV(pa, pq, pc);
                        }

                        // generate Normal coordinates if there is any
                        if (ln_a_tri.hasNormal) {
                            // the computed Normal coordinate if the intersection point
                            let pq: Vector3 = ln_a_tri.GenerateNormal(qa);
                            let pa: Vector3 = ln_a_tri.normalA;
                            let pb: Vector3 = ln_a_tri.normalB;
                            let pc: Vector3 = ln_a_tri.normalC;

                            ta.SetNormal(pa, pb, pq);
                            tb.SetNormal(pa, pq, pc);
                        }

                        // generate Tangent coordinates if there is any
                        if (ln_a_tri.hasTangent) {
                            // the computed Tangent coordinate if the intersection point
                            let pq: Vector4 = ln_a_tri.GenerateTangent(qa);
                            let pa: Vector4 = ln_a_tri.tangentA;
                            let pb: Vector4 = ln_a_tri.tangentB;
                            let pc: Vector4 = ln_a_tri.tangentC;

                            ta.SetTangent(pa, pb, pq);
                            tb.SetTangent(pa, pq, pc);
                        }

                        // b point lies on the upside of the plane
                        if (sb == SideOfPlane.UP) {
                            (result_q_b as IntersectionResult).AddUpperHull(ta).AddLowerHull(tb);
                        }

                        // b point lies on the downside of the plane
                        else if (sb == SideOfPlane.DOWN) {
                            (result_q_b as IntersectionResult).AddUpperHull(tb).AddLowerHull(ta);
                        }
                    }
                }

                // test the case where the b point lies on the plane itself
                else if (sb == SideOfPlane.ON) {
                    // if the point b is on the plane, test line a-c
                    if (Intersector.Intersect(pl, a, c, qa)) {
                        // line a-c intersected, construct out triangles and return approprietly
                        (result_q_b as IntersectionResult).AddIntersectionPoint(qa);
                        (result_q_b as IntersectionResult).AddIntersectionPoint(b);

                        // our two generated triangles, we need to figure out which
                        // triangle goes into the UPPER hull and which goes into the LOWER hull
                        let ta: Triangle = new Triangle(a, b, qa);
                        let tb: Triangle = new Triangle(qa, b, c);

                        // generate UV coordinates if there is any
                        if (ln_a_tri.hasUV) {
                            // the computed UV coordinate if the intersection point
                            let pq: Vector2 = ln_a_tri.GenerateUV(qa);
                            let pa: Vector2 = ln_a_tri.uvA;
                            let pb: Vector2 = ln_a_tri.uvB;
                            let pc: Vector2 = ln_a_tri.uvC;

                            ta.SetUV(pa, pb, pq);
                            tb.SetUV(pq, pb, pc);
                        }

                        // generate Normal coordinates if there is any
                        if (ln_a_tri.hasNormal) {
                            // the computed Normal coordinate if the intersection point
                            let pq: Vector3 = ln_a_tri.GenerateNormal(qa);
                            let pa: Vector3 = ln_a_tri.normalA;
                            let pb: Vector3 = ln_a_tri.normalB;
                            let pc: Vector3 = ln_a_tri.normalC;

                            ta.SetNormal(pa, pb, pq);
                            tb.SetNormal(pq, pb, pc);
                        }

                        // generate Tangent coordinates if there is any
                        if (ln_a_tri.hasTangent) {
                            // the computed Tangent coordinate if the intersection point
                            let pq: Vector4 = ln_a_tri.GenerateTangent(qa);
                            let pa: Vector4 = ln_a_tri.tangentA;
                            let pb: Vector4 = ln_a_tri.tangentB;
                            let pc: Vector4 = ln_a_tri.tangentC;

                            ta.SetTangent(pa, pb, pq);
                            tb.SetTangent(pq, pb, pc);
                        }

                        // a point lies on the upside of the plane
                        if (sa == SideOfPlane.UP) {
                            (result_q_b as IntersectionResult).AddUpperHull(ta).AddLowerHull(tb);
                        }

                        // a point lies on the downside of the plane
                        else if (sa == SideOfPlane.DOWN) {
                            (result_q_b as IntersectionResult).AddUpperHull(tb).AddLowerHull(ta);
                        }
                    }
                }

                // test the case where the c point lies on the plane itself
                else if (sc == SideOfPlane.ON) {
                    // if the point c is on the plane, test line a-b
                    if (Intersector.Intersect(pl, a, b, qa)) {
                        // line a-c intersected, construct out triangles and return approprietly
                        (result_q_b as IntersectionResult).AddIntersectionPoint(qa);
                        (result_q_b as IntersectionResult).AddIntersectionPoint(c);

                        // our two generated triangles, we need to figure out which
                        // triangle goes into the UPPER hull and which goes into the LOWER hull
                        let ta: Triangle = new Triangle(a, qa, c);
                        let tb: Triangle = new Triangle(qa, b, c);

                        // generate UV coordinates if there is any
                        if (ln_a_tri.hasUV) {
                            // the computed UV coordinate if the intersection point
                            let pq: Vector2 = ln_a_tri.GenerateUV(qa);
                            let pa: Vector2 = ln_a_tri.uvA;
                            let pb: Vector2 = ln_a_tri.uvB;
                            let pc: Vector2 = ln_a_tri.uvC;

                            ta.SetUV(pa, pq, pc);
                            tb.SetUV(pq, pb, pc);
                        }

                        // generate Normal coordinates if there is any
                        if (ln_a_tri.hasNormal) {
                            // the computed Normal coordinate if the intersection point
                            let pq: Vector3 = ln_a_tri.GenerateNormal(qa);
                            let pa: Vector3 = ln_a_tri.normalA;
                            let pb: Vector3 = ln_a_tri.normalB;
                            let pc: Vector3 = ln_a_tri.normalC;

                            ta.SetNormal(pa, pq, pc);
                            tb.SetNormal(pq, pb, pc);
                        }

                        // generate Tangent coordinates if there is any
                        if (ln_a_tri.hasTangent) {
                            // the computed Tangent coordinate if the intersection point
                            let pq: Vector4 = ln_a_tri.GenerateTangent(qa);
                            let pa: Vector4 = ln_a_tri.tangentA;
                            let pb: Vector4 = ln_a_tri.tangentB;
                            let pc: Vector4 = ln_a_tri.tangentC;

                            ta.SetTangent(pa, pq, pc);
                            tb.SetTangent(pq, pb, pc);
                        }

                        // a point lies on the upside of the plane
                        if (sa == SideOfPlane.UP) {
                            (result_q_b as IntersectionResult).AddUpperHull(ta).AddLowerHull(tb);
                        }

                        // a point lies on the downside of the plane
                        else if (sa == SideOfPlane.DOWN) {
                            (result_q_b as IntersectionResult).AddUpperHull(tb).AddLowerHull(ta);
                        }
                    }
                }

                // at this point, all edge cases have been tested and failed, we need to perform
                // full intersection tests against the lines. From this point onwards we will generate
                // 3 triangles
                else if (sa != sb && Intersector.Intersect(pl, a, b, qa)) {
                    // intersection found against a - b
                    (result_q_b as IntersectionResult).AddIntersectionPoint(qa);

                    // since intersection was found against a - b, we need to check which other
                    // lines to check (we only need to check one more line) for intersection.
                    // the line we check against will be the line against the point which lies on
                    // the other side of the plane.
                    if (sa == sc) {
                        // we likely have an intersection against line b-c which will complete this loop
                        if (Intersector.Intersect(pl, b, c, qb)) {
                            (result_q_b as IntersectionResult).AddIntersectionPoint(qb);

                            // our three generated triangles. Two of these triangles will end
                            // up on either the UPPER or LOWER hulls.
                            let ta: Triangle = new Triangle(qa, b, qb);
                            let tb: Triangle = new Triangle(a, qa, qb);
                            let tc: Triangle = new Triangle(a, qb, c);

                            // generate UV coordinates if there is any
                            if (ln_a_tri.hasUV) {
                                // the computed UV coordinate if the intersection point
                                let pqa: Vector2 = ln_a_tri.GenerateUV(qa);
                                let pqb: Vector2 = ln_a_tri.GenerateUV(qb);
                                let pa: Vector2 = ln_a_tri.uvA;
                                let pb: Vector2 = ln_a_tri.uvB;
                                let pc: Vector2 = ln_a_tri.uvC;

                                ta.SetUV(pqa, pb, pqb);
                                tb.SetUV(pa, pqa, pqb);
                                tc.SetUV(pa, pqb, pc);
                            }

                            // generate Normal coordinates if there is any
                            if (ln_a_tri.hasNormal) {
                                // the computed Normal coordinate if the intersection point
                                let pqa: Vector3 = ln_a_tri.GenerateNormal(qa);
                                let pqb: Vector3 = ln_a_tri.GenerateNormal(qb);
                                let pa: Vector3 = ln_a_tri.normalA;
                                let pb: Vector3 = ln_a_tri.normalB;
                                let pc: Vector3 = ln_a_tri.normalC;

                                ta.SetNormal(pqa, pb, pqb);
                                tb.SetNormal(pa, pqa, pqb);
                                tc.SetNormal(pa, pqb, pc);
                            }

                            // generate Tangent coordinates if there is any
                            if (ln_a_tri.hasTangent) {
                                // the computed Tangent coordinate if the intersection point
                                let pqa: Vector4 = ln_a_tri.GenerateTangent(qa);
                                let pqb: Vector4 = ln_a_tri.GenerateTangent(qb);
                                let pa: Vector4 = ln_a_tri.tangentA;
                                let pb: Vector4 = ln_a_tri.tangentB;
                                let pc: Vector4 = ln_a_tri.tangentC;

                                ta.SetTangent(pqa, pb, pqb);
                                tb.SetTangent(pa, pqa, pqb);
                                tc.SetTangent(pa, pqb, pc);
                            }

                            if (sa == SideOfPlane.UP) {
                                (result_q_b as IntersectionResult).AddUpperHull(tb).AddUpperHull(tc).AddLowerHull(ta);
                            }
                            else {
                                (result_q_b as IntersectionResult).AddLowerHull(tb).AddLowerHull(tc).AddUpperHull(ta);
                            }
                        }
                    }
                    else {
                        // in this scenario, the point a is a "lone" point which lies in either upper
                        // or lower HULL. We need to perform another intersection to find the last point
                        if (Intersector.Intersect(pl, a, c, qb)) {
                            (result_q_b as IntersectionResult).AddIntersectionPoint(qb);

                            // our three generated triangles. Two of these triangles will end
                            // up on either the UPPER or LOWER hulls.
                            let ta: Triangle = new Triangle(a, qa, qb);
                            let tb: Triangle = new Triangle(qa, b, c);
                            let tc: Triangle = new Triangle(qb, qa, c);

                            // generate UV coordinates if there is any
                            if (ln_a_tri.hasUV) {
                                // the computed UV coordinate if the intersection point
                                let pqa: Vector2 = ln_a_tri.GenerateUV(qa);
                                let pqb: Vector2 = ln_a_tri.GenerateUV(qb);
                                let pa: Vector2 = ln_a_tri.uvA;
                                let pb: Vector2 = ln_a_tri.uvB;
                                let pc: Vector2 = ln_a_tri.uvC;

                                ta.SetUV(pa, pqa, pqb);
                                tb.SetUV(pqa, pb, pc);
                                tc.SetUV(pqb, pqa, pc);
                            }

                            // generate Normal coordinates if there is any
                            if (ln_a_tri.hasNormal) {
                                // the computed Normal coordinate if the intersection point
                                let pqa: Vector3 = ln_a_tri.GenerateNormal(qa);
                                let pqb: Vector3 = ln_a_tri.GenerateNormal(qb);
                                let pa: Vector3 = ln_a_tri.normalA;
                                let pb: Vector3 = ln_a_tri.normalB;
                                let pc: Vector3 = ln_a_tri.normalC;

                                ta.SetNormal(pa, pqa, pqb);
                                tb.SetNormal(pqa, pb, pc);
                                tc.SetNormal(pqb, pqa, pc);
                            }

                            // generate Tangent coordinates if there is any
                            if (ln_a_tri.hasTangent) {
                                // the computed Tangent coordinate if the intersection point
                                let pqa: Vector4 = ln_a_tri.GenerateTangent(qa);
                                let pqb: Vector4 = ln_a_tri.GenerateTangent(qb);
                                let pa: Vector4 = ln_a_tri.tangentA;
                                let pb: Vector4 = ln_a_tri.tangentB;
                                let pc: Vector4 = ln_a_tri.tangentC;

                                ta.SetTangent(pa, pqa, pqb);
                                tb.SetTangent(pqa, pb, pc);
                                tc.SetTangent(pqb, pqa, pc);
                            }

                            if (sa == SideOfPlane.UP) {
                                (result_q_b as IntersectionResult).AddUpperHull(ta).AddLowerHull(tb).AddLowerHull(tc);
                            }
                            else {
                                (result_q_b as IntersectionResult).AddLowerHull(ta).AddUpperHull(tb).AddUpperHull(tc);
                            }
                        }
                    }
                }

                // if line a-b did not intersect (or the lie on the same side of the plane)
                // this simplifies the problem a fair bit. This means we have an intersection 
                // in line a-c and b-c, which we can use to build a new UPPER and LOWER hulls
                // we are expecting both of these intersection tests to pass, otherwise something
                // went wrong (float errors? missed a checked case?)
                else if (Intersector.Intersect(pl, c, a, qa) && Intersector.Intersect(pl, c, b, qb)) {
                    // in here we know that line a-b actually lie on the same side of the plane, this will
                    // simplify the rest of the logic. We also have our intersection points
                    // the computed UV coordinate of the intersection point

                    (result_q_b as IntersectionResult).AddIntersectionPoint(qa);
                    (result_q_b as IntersectionResult).AddIntersectionPoint(qb);

                    // our three generated triangles. Two of these triangles will end
                    // up on either the UPPER or LOWER hulls.
                    let ta: Triangle = new Triangle(qa, qb, c);
                    let tb: Triangle = new Triangle(a, qb, qa);
                    let tc: Triangle = new Triangle(a, b, qb);

                    // generate UV coordinates if there is any
                    if (ln_a_tri.hasUV) {
                        // the computed UV coordinate if the intersection point
                        let pqa: Vector2 = ln_a_tri.GenerateUV(qa);
                        let pqb: Vector2 = ln_a_tri.GenerateUV(qb);
                        let pa: Vector2 = ln_a_tri.uvA;
                        let pb: Vector2 = ln_a_tri.uvB;
                        let pc: Vector2 = ln_a_tri.uvC;

                        ta.SetUV(pqa, pqb, pc);
                        tb.SetUV(pa, pqb, pqa);
                        tc.SetUV(pa, pb, pqb);
                    }

                    // generate Normal coordinates if there is any
                    if (ln_a_tri.hasNormal) {
                        // the computed Normal coordinate if the intersection point
                        let pqa: Vector3 = ln_a_tri.GenerateNormal(qa);
                        let pqb: Vector3 = ln_a_tri.GenerateNormal(qb);
                        let pa: Vector3 = ln_a_tri.normalA;
                        let pb: Vector3 = ln_a_tri.normalB;
                        let pc: Vector3 = ln_a_tri.normalC;

                        ta.SetNormal(pqa, pqb, pc);
                        tb.SetNormal(pa, pqb, pqa);
                        tc.SetNormal(pa, pb, pqb);
                    }

                    // generate Tangent coordinates if there is any
                    if (ln_a_tri.hasTangent) {
                        // the computed Tangent coordinate if the intersection point
                        let pqa: Vector4 = ln_a_tri.GenerateTangent(qa);
                        let pqb: Vector4 = ln_a_tri.GenerateTangent(qb);
                        let pa: Vector4 = ln_a_tri.tangentA;
                        let pb: Vector4 = ln_a_tri.tangentB;
                        let pc: Vector4 = ln_a_tri.tangentC;

                        ta.SetTangent(pqa, pqb, pc);
                        tb.SetTangent(pa, pqb, pqa);
                        tc.SetTangent(pa, pb, pqb);
                    }

                    if (sa == SideOfPlane.UP) {
                        (result_q_b as IntersectionResult).AddUpperHull(tb).AddUpperHull(tc).AddLowerHull(ta);
                    }
                    else {
                        (result_q_b as IntersectionResult).AddLowerHull(tb).AddLowerHull(tc).AddUpperHull(ta);
                    }
                }
            }
        }
        /**
         * Support functionality 
         */
        public static TriArea2D(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): number {
            return (x1 - x2) * (y2 - y3) - (x2 - x3) * (y1 - y2);
        }
    }
}