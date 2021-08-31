namespace EzySlice {
    import Vector3 = Laya.Vector3;
    export class IntersectionResult {
        private is_success: boolean;
        private readonly upper_hull: Triangle[];
        private readonly lower_hull: Triangle[];
        private readonly intersection_pt: Vector3[];

        private upper_hull_count: number;
        private lower_hull_count: number;
        private intersection_pt_count: number;

        constructor() {
            this.is_success = false;

            this.upper_hull = new Triangle[2];
            this.lower_hull = new Triangle[2];
            this.intersection_pt = new Vector3[2];

            this.upper_hull_count = 0;
            this.lower_hull_count = 0;
            this.intersection_pt_count = 0;
        }

        get upperHull(): Triangle[] {
            return this.upper_hull;
        }
        get lowerHull(): Triangle[] {
            return this.lower_hull;
        }
        get intersectionPoints(): Vector3[] {
            return this.intersection_pt;
        }
        get upperHullCount(): number {
            return this.upper_hull_count;
        }
        get lowerHullCount(): number {
            return this.lower_hull_count;
        }
        get intersectionPointCount(): number {
            return this.intersection_pt_count;
        }
        get isValid(): boolean {
            return this.is_success;
        }

        AddUpperHull(tri: Triangle): IntersectionResult {
            this.upper_hull[this.upper_hull_count++] = tri;

            this.is_success = true;

            return this;
        }
        AddLowerHull(tri: Triangle): IntersectionResult {
            this.lower_hull[this.lower_hull_count++] = tri;

            this.is_success = true;

            return this;
        }
        AddIntersectionPoint(pt: Vector3) {
            this.intersection_pt[this.intersection_pt_count++] = pt;
        }
        Clear() {
            this.is_success = false;
            this.upper_hull_count = 0;
            this.lower_hull_count = 0;
            this.intersection_pt_count = 0;
        }

    }
}