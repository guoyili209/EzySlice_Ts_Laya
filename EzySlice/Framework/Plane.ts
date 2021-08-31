namespace EzySlice {
    export enum SideOfPlane {
        UP,
        DOWN,
        ON
    }
    import Vector3 = Laya.Vector3;
    import Transform = Laya.Transform3D;
    export class Plane {
        private m_normal: Vector3;
        private m_dist: number;
        constructor();
        constructor(norm: Vector3, dot: number);
        constructor(pos: Vector3, norm: Vector3);
        constructor(a?: Vector3, b?: Vector3 | number) {
            if (typeof b == 'number') {
                this.m_normal = a;
                this.m_dist = b;
            } else if (b instanceof Vector3) {
                this.m_normal = b;
                this.m_dist = Vector3.dot(b, a);
            }
        }

        Compute(pos: Vector3, norm: Vector3);
        Compute(trans: Transform);
        Compute(obj: Laya.Sprite3D);
        Compute(a: Vector3 | Transform | Laya.Sprite3D, b?: Vector3) {
            if (a instanceof Vector3) {
                this.m_normal = b;
                this.m_dist = Vector3.dot(b, a);
            } else if (a instanceof Transform) {
                let up: Vector3;
                a.getUp(up);
                this.Compute(a.position, up);
            } else if (a instanceof Laya.Sprite3D) {
                this.Compute(a.transform);
            }
        }
        get normal(): Vector3 {
            return this.m_normal;
        }
        get dist(): number {
            return this.m_dist;
        }
        SideOf(pt: Vector3): SideOfPlane {
            let result: number = Vector3.dot(this.m_normal, pt) - this.m_dist;
            if (result > Number.EPSILON) {
                return SideOfPlane.UP;
            }
            if (result < -Number.EPSILON) {
                return SideOfPlane.DOWN;
            }
            return SideOfPlane.ON;
        }
        // OnDebugDraw();
        // OnDebugDraw(drawColor?: Laya.Color) {
        //     if (drawColor) {

        //     }
        // }
    }
}